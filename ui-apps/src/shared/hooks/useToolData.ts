import { useState, useCallback } from 'react';
import { useApp } from '@modelcontextprotocol/ext-apps/react';

interface UseToolDataResult<T> {
  data: T | null;
  error: string | null;
  isConnected: boolean;
}

export function useToolData<T>(): UseToolDataResult<T> {
  const [data, setData] = useState<T | null>(null);

  const onAppCreated = useCallback((app: any) => {
    app.ontoolresult = (result: any) => {
      if (result?.content) {
        const textItem = Array.isArray(result.content)
          ? result.content.find((c: any) => c.type === 'text')
          : null;
        if (textItem?.text) {
          try {
            setData(JSON.parse(textItem.text) as T);
          } catch {
            setData(textItem.text as unknown as T);
          }
        }
      }
    };
  }, []);

  const { isConnected, error } = useApp({
    appInfo: { name: 'n8n-mcp-ui', version: '1.0.0' },
    capabilities: {},
    onAppCreated,
  });

  return {
    data,
    error: error?.message ?? null,
    isConnected,
  };
}
