import React from 'react';
import '@shared/styles/theme.css';
import { Card, Badge, Expandable } from '@shared/components';
import { useToolData } from '@shared/hooks/useToolData';
import type { OperationResultData } from '@shared/types';

export default function App() {
  const { data, error, isConnected } = useToolData<OperationResultData>();

  if (error) {
    return <div style={{ padding: '16px', color: '#ef4444' }}>Error: {error}</div>;
  }

  if (!isConnected) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Connecting...</div>;
  }

  if (!data) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Waiting for data...</div>;
  }

  const isSuccess = data.success === true;
  const workflowName = data.data?.name || data.data?.workflowName;
  const workflowId = data.data?.id || data.data?.workflowId;
  const nodeCount = data.data?.nodeCount;
  const isDeleted = data.data?.deleted === true;
  const operationsApplied = data.data?.operationsApplied;

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Badge variant={isSuccess ? 'success' : 'error'}>
          {isSuccess ? 'Success' : 'Error'}
        </Badge>
      </div>

      {(workflowName || workflowId) && (
        <Card title="Workflow">
          <div style={{ fontSize: '14px' }}>
            {workflowName && <div><strong>Name:</strong> {workflowName}</div>}
            {workflowId && <div><strong>ID:</strong> {workflowId}</div>}
            {nodeCount !== undefined && <div><strong>Nodes:</strong> {nodeCount}</div>}
            {isDeleted && <div style={{ color: 'var(--n8n-warning)', marginTop: '4px' }}>Deleted</div>}
            {operationsApplied !== undefined && (
              <div><strong>Operations applied:</strong> {operationsApplied}</div>
            )}
          </div>
        </Card>
      )}

      {(data.message || data.error) && (
        <Card>
          <div style={{ fontSize: '13px' }}>{data.message || data.error}</div>
        </Card>
      )}

      {data.details && (
        <Expandable title="Details">
          <pre style={{ fontSize: '11px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(data.details, null, 2)}
          </pre>
        </Expandable>
      )}
    </div>
  );
}
