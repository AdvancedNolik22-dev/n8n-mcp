import React from 'react';
import '@shared/styles/theme.css';
import { Card, Badge, Expandable } from '@shared/components';
import { useToolData } from '@shared/hooks/useToolData';
import type { ValidationSummaryData } from '@shared/types';

export default function App() {
  const { data, error, isConnected } = useToolData<ValidationSummaryData>();

  if (error) {
    return <div style={{ padding: '16px', color: '#ef4444' }}>Error: {error}</div>;
  }

  if (!isConnected) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Connecting...</div>;
  }

  if (!data) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Waiting for data...</div>;
  }

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Badge variant={data.valid ? 'success' : 'error'}>
          {data.valid ? 'Valid' : 'Invalid'}
        </Badge>
        {data.displayName && (
          <span style={{ fontSize: '14px', color: 'var(--n8n-text-muted)' }}>{data.displayName}</span>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--n8n-error)' }}>{data.errorCount}</span> errors
          </div>
          <div>
            <span style={{ color: 'var(--n8n-warning)' }}>{data.warningCount}</span> warnings
          </div>
        </div>
      </Card>

      {data.errors.length > 0 && (
        <Expandable title="Errors" count={data.errors.length} defaultOpen>
          {data.errors.map((err, i) => (
            <div key={i} style={{
              padding: '8px',
              marginBottom: '6px',
              background: 'var(--n8n-error-light)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--n8n-error)',
            }}>
              <div style={{ fontWeight: 600 }}>{err.type}</div>
              {err.property && <div style={{ opacity: 0.8 }}>Property: {err.property}</div>}
              <div>{err.message}</div>
              {err.fix && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.9 }}>Fix: {err.fix}</div>
              )}
            </div>
          ))}
        </Expandable>
      )}

      {data.warnings.length > 0 && (
        <Expandable title="Warnings" count={data.warnings.length}>
          {data.warnings.map((warn, i) => (
            <div key={i} style={{
              padding: '8px',
              marginBottom: '6px',
              background: 'var(--n8n-warning-light)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--n8n-warning)',
            }}>
              <div style={{ fontWeight: 600 }}>{warn.type}</div>
              {warn.property && <div style={{ opacity: 0.8 }}>Property: {warn.property}</div>}
              <div>{warn.message}</div>
            </div>
          ))}
        </Expandable>
      )}

      {data.suggestions && data.suggestions.length > 0 && (
        <Expandable title="Suggestions" count={data.suggestions.length}>
          <ul style={{ paddingLeft: '16px', fontSize: '12px' }}>
            {data.suggestions.map((suggestion, i) => (
              <li key={i} style={{ padding: '2px 0', color: 'var(--n8n-info)' }}>{suggestion}</li>
            ))}
          </ul>
        </Expandable>
      )}
    </div>
  );
}
