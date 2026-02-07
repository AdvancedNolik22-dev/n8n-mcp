import { useState, useEffect } from 'react';

declare global {
  interface Window {
    __MCP_DATA__?: unknown;
  }
}

export function useToolData<T>(): T | null {
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    // Try window.__MCP_DATA__ first (injected by host)
    if (window.__MCP_DATA__) {
      setData(window.__MCP_DATA__ as T);
      return;
    }

    // Try embedded script tag
    const scriptEl = document.getElementById('mcp-data');
    if (scriptEl?.textContent) {
      try {
        setData(JSON.parse(scriptEl.textContent) as T);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  return data;
}
