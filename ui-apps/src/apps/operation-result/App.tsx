import React from 'react';
import '@shared/styles/theme.css';
import { Card, Badge, Expandable } from '@shared/components';
import { useToolData } from '@shared/hooks/useToolData';
import type { OperationResultData } from '@shared/types';

export default function App() {
  const data = useToolData<OperationResultData>();

  if (!data) {
    return <div style={{ padding: '16px', color: 'var(--n8n-text-muted)' }}>Loading...</div>;
  }

  const isSuccess = data.status === 'success';

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Badge variant={isSuccess ? 'success' : 'error'}>
          {isSuccess ? 'Success' : 'Error'}
        </Badge>
        <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{data.operation}</h2>
      </div>

      <Card title="Workflow">
        <div style={{ fontSize: '14px' }}>
          {data.workflowName && <div><strong>Name:</strong> {data.workflowName}</div>}
          {data.workflowId && <div><strong>ID:</strong> {data.workflowId}</div>}
          {data.timestamp && (
            <div style={{ color: 'var(--n8n-text-muted)', fontSize: '12px', marginTop: '4px' }}>
              {data.timestamp}
            </div>
          )}
        </div>
      </Card>

      {data.message && (
        <Card>
          <div style={{ fontSize: '13px' }}>{data.message}</div>
        </Card>
      )}

      {data.changes && (
        <>
          {data.changes.nodesAdded && data.changes.nodesAdded.length > 0 && (
            <Expandable title="Nodes Added" count={data.changes.nodesAdded.length} defaultOpen>
              <ul style={{ listStyle: 'none', fontSize: '13px' }}>
                {data.changes.nodesAdded.map((node, i) => (
                  <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--n8n-border)' }}>
                    <span style={{ color: 'var(--n8n-success)' }}>+</span> {node}
                  </li>
                ))}
              </ul>
            </Expandable>
          )}

          {data.changes.nodesModified && data.changes.nodesModified.length > 0 && (
            <Expandable title="Nodes Modified" count={data.changes.nodesModified.length}>
              <ul style={{ listStyle: 'none', fontSize: '13px' }}>
                {data.changes.nodesModified.map((node, i) => (
                  <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--n8n-border)' }}>
                    <span style={{ color: 'var(--n8n-warning)' }}>~</span> {node}
                  </li>
                ))}
              </ul>
            </Expandable>
          )}

          {data.changes.nodesRemoved && data.changes.nodesRemoved.length > 0 && (
            <Expandable title="Nodes Removed" count={data.changes.nodesRemoved.length}>
              <ul style={{ listStyle: 'none', fontSize: '13px' }}>
                {data.changes.nodesRemoved.map((node, i) => (
                  <li key={i} style={{ padding: '4px 0', borderBottom: '1px solid var(--n8n-border)' }}>
                    <span style={{ color: 'var(--n8n-error)' }}>-</span> {node}
                  </li>
                ))}
              </ul>
            </Expandable>
          )}
        </>
      )}
    </div>
  );
}
