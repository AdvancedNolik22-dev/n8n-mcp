import React from 'react';
import '@shared/styles/theme.css';
import { Card, Badge, Expandable } from '@shared/components';
import { useToolData } from '@shared/hooks/useToolData';
import type { ValidationSummaryData, ValidationError, ValidationWarning } from '@shared/types';

export default function App() {
  const { data: raw, error, isConnected } = useToolData<ValidationSummaryData>();

  if (error) {
    return <div style={{ padding: '16px', color: '#ef4444' }}>Error: {error}</div>;
  }

  if (!isConnected) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Connecting...</div>;
  }

  if (!raw) {
    return <div style={{ padding: '16px', color: '#9ca3af' }}>Waiting for data...</div>;
  }

  // n8n_validate_workflow wraps result in { success, data: {...} }
  // validate_node and validate_workflow return data directly
  const inner = raw.data || raw;
  const valid = inner.valid ?? raw.valid ?? false;
  const displayName = raw.displayName || raw.data?.workflowName;
  const errors: ValidationError[] = inner.errors || raw.errors || [];
  const warnings: ValidationWarning[] = inner.warnings || raw.warnings || [];
  const suggestions: string[] = inner.suggestions || raw.suggestions || [];
  const errorCount = raw.summary?.errorCount ?? inner.summary?.errorCount ?? errors.length;
  const warningCount = raw.summary?.warningCount ?? inner.summary?.warningCount ?? warnings.length;

  return (
    <div style={{ maxWidth: '480px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Badge variant={valid ? 'success' : 'error'}>
          {valid ? 'Valid' : 'Invalid'}
        </Badge>
        {displayName && (
          <span style={{ fontSize: '14px', color: 'var(--n8n-text-muted)' }}>{displayName}</span>
        )}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
          <div>
            <span style={{ color: 'var(--n8n-error)' }}>{errorCount}</span> errors
          </div>
          <div>
            <span style={{ color: 'var(--n8n-warning)' }}>{warningCount}</span> warnings
          </div>
        </div>
      </Card>

      {errors.length > 0 && (
        <Expandable title="Errors" count={errors.length} defaultOpen>
          {errors.map((err, i) => (
            <div key={i} style={{
              padding: '8px',
              marginBottom: '6px',
              background: 'var(--n8n-error-light)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--n8n-error)',
            }}>
              {(err.type || err.node) && (
                <div style={{ fontWeight: 600 }}>{err.type || err.node}</div>
              )}
              {err.property && <div style={{ opacity: 0.8 }}>Property: {err.property}</div>}
              <div>{err.message}</div>
              {err.fix && (
                <div style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.9 }}>Fix: {err.fix}</div>
              )}
            </div>
          ))}
        </Expandable>
      )}

      {warnings.length > 0 && (
        <Expandable title="Warnings" count={warnings.length}>
          {warnings.map((warn, i) => (
            <div key={i} style={{
              padding: '8px',
              marginBottom: '6px',
              background: 'var(--n8n-warning-light)',
              borderRadius: '4px',
              fontSize: '12px',
              color: 'var(--n8n-warning)',
            }}>
              {(warn.type || warn.node) && (
                <div style={{ fontWeight: 600 }}>{warn.type || warn.node}</div>
              )}
              {warn.property && <div style={{ opacity: 0.8 }}>Property: {warn.property}</div>}
              <div>{warn.message}</div>
            </div>
          ))}
        </Expandable>
      )}

      {suggestions.length > 0 && (
        <Expandable title="Suggestions" count={suggestions.length}>
          <ul style={{ paddingLeft: '16px', fontSize: '12px' }}>
            {suggestions.map((suggestion, i) => (
              <li key={i} style={{ padding: '2px 0', color: 'var(--n8n-info)' }}>{suggestion}</li>
            ))}
          </ul>
        </Expandable>
      )}
    </div>
  );
}
