import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UIAppRegistry } from '@/mcp/ui/registry';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

import { existsSync, readFileSync } from 'fs';

const mockExistsSync = vi.mocked(existsSync);
const mockReadFileSync = vi.mocked(readFileSync);

describe('UI Meta Injection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    UIAppRegistry.reset();
  });

  describe('when HTML is loaded', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('<html>ui content</html>');
      UIAppRegistry.load();
    });

    it('should add _meta.ui for matching tools', () => {
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow');
      expect(uiApp).not.toBeNull();
      expect(uiApp!.html).not.toBeNull();

      // Simulate the injection logic from server.ts
      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeDefined();
      expect(mcpResponse._meta.ui.app).toBe('n8n-mcp://ui/operation-result');
    });

    it('should add _meta.ui for validation tools', () => {
      const uiApp = UIAppRegistry.getAppForTool('validate_workflow');
      expect(uiApp).not.toBeNull();

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'validation result' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeDefined();
      expect(mcpResponse._meta.ui.app).toBe('n8n-mcp://ui/validation-summary');
    });

    it('should NOT add _meta.ui for non-matching tools', () => {
      const uiApp = UIAppRegistry.getAppForTool('get_node_info');
      expect(uiApp).toBeNull();

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'node info' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeUndefined();
    });

    it('should produce _meta with exact shape { ui: { app: string } }', () => {
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow')!;
      const meta = { ui: { app: uiApp.config.uri } };

      expect(meta).toEqual({
        ui: {
          app: 'n8n-mcp://ui/operation-result',
        },
      });
      expect(Object.keys(meta)).toEqual(['ui']);
      expect(Object.keys(meta.ui)).toEqual(['app']);
      expect(typeof meta.ui.app).toBe('string');
    });

    it('should produce _meta.ui.app that matches the config uri', () => {
      const uiApp = UIAppRegistry.getAppForTool('validate_node')!;
      const meta = { ui: { app: uiApp.config.uri } };
      expect(meta.ui.app).toBe(uiApp.config.uri);
      expect(meta.ui.app).toBe('n8n-mcp://ui/validation-summary');
    });
  });

  describe('when HTML is not loaded', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(false);
      UIAppRegistry.load();
    });

    it('should NOT add _meta.ui even for matching tools', () => {
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow');
      expect(uiApp).not.toBeNull();
      expect(uiApp!.html).toBeNull();

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeUndefined();
    });

    it('should NOT add _meta.ui for validation tools without HTML', () => {
      const uiApp = UIAppRegistry.getAppForTool('validate_node');
      expect(uiApp).not.toBeNull();
      expect(uiApp!.html).toBeNull();

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeUndefined();
    });
  });

  describe('when registry has not been loaded at all', () => {
    it('should NOT add _meta because getAppForTool returns null', () => {
      // Registry never loaded - reset() was called in beforeEach
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow');
      expect(uiApp).toBeNull();

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta).toBeUndefined();
    });
  });

  describe('coexistence with structuredContent', () => {
    beforeEach(() => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('<html>ui</html>');
      UIAppRegistry.load();
    });

    it('should coexist with structuredContent on the response', () => {
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow');

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
        structuredContent: { workflowId: '123', status: 'created' },
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse.structuredContent).toBeDefined();
      expect(mcpResponse.structuredContent.workflowId).toBe('123');
      expect(mcpResponse._meta).toBeDefined();
      expect(mcpResponse._meta.ui.app).toBe('n8n-mcp://ui/operation-result');
    });

    it('should not overwrite existing _meta properties when merging', () => {
      const uiApp = UIAppRegistry.getAppForTool('n8n_create_workflow');

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'result' }],
        _meta: { existingProp: 'value' },
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ...mcpResponse._meta, ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse._meta.existingProp).toBe('value');
      expect(mcpResponse._meta.ui.app).toBe('n8n-mcp://ui/operation-result');
    });

    it('should work with responses that have both structuredContent and existing _meta', () => {
      const uiApp = UIAppRegistry.getAppForTool('validate_workflow');

      const mcpResponse: any = {
        content: [{ type: 'text', text: 'validation ok' }],
        structuredContent: { valid: true, errors: [] },
        _meta: { timing: 42 },
      };

      if (uiApp && uiApp.html) {
        mcpResponse._meta = { ...mcpResponse._meta, ui: { app: uiApp.config.uri } };
      }

      expect(mcpResponse.structuredContent.valid).toBe(true);
      expect(mcpResponse._meta.timing).toBe(42);
      expect(mcpResponse._meta.ui.app).toBe('n8n-mcp://ui/validation-summary');
    });
  });
});
