import { describe, it, expect, vi } from 'vitest';
import { n8nManagementTools } from '@/mcp/tools-n8n-manager';
import type {
  GenerateWorkflowHandler,
  GenerateWorkflowArgs,
  GenerateWorkflowResult,
  GenerateWorkflowHelpers,
} from '@/types/generate-workflow';

describe('n8n_generate_workflow', () => {
  describe('tool definition', () => {
    const tool = n8nManagementTools.find((t) => t.name === 'n8n_generate_workflow');

    it('exists in n8nManagementTools', () => {
      expect(tool).toBeDefined();
    });

    it('has correct input schema', () => {
      expect(tool!.inputSchema.properties).toHaveProperty('description');
      expect(tool!.inputSchema.properties).toHaveProperty('skip_cache');
      expect(tool!.inputSchema.required).toEqual(['description']);
    });

    it('has correct annotations', () => {
      expect(tool!.annotations).toEqual({
        title: 'Generate Workflow',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      });
    });
  });

  describe('types', () => {
    it('GenerateWorkflowHandler accepts correct signature', () => {
      const handler: GenerateWorkflowHandler = async (args, context, helpers) => {
        return {
          success: true,
          source: 'generated',
          workflow_id: '123',
          workflow_name: 'Test',
          message: 'Done',
        };
      };
      expect(handler).toBeDefined();
    });

    it('GenerateWorkflowHelpers has required methods', () => {
      const helpers: GenerateWorkflowHelpers = {
        createWorkflow: vi.fn(),
        validateWorkflow: vi.fn(),
        autofixWorkflow: vi.fn(),
        getWorkflow: vi.fn(),
      };
      expect(helpers.createWorkflow).toBeDefined();
      expect(helpers.validateWorkflow).toBeDefined();
      expect(helpers.autofixWorkflow).toBeDefined();
      expect(helpers.getWorkflow).toBeDefined();
    });

    it('GenerateWorkflowResult supports both success and failure', () => {
      const success: GenerateWorkflowResult = {
        success: true,
        source: 'cache',
        workflow_id: 'abc',
        workflow_name: 'Test',
        workflow_url: 'https://example.com/workflow/abc',
        node_summary: 'Trigger → HTTP Request → Slack',
      };
      expect(success.success).toBe(true);

      const failure: GenerateWorkflowResult = {
        success: false,
        error: 'Generation failed',
        message: 'Try again',
      };
      expect(failure.success).toBe(false);
    });

    it('GenerateWorkflowArgs has description and optional skip_cache', () => {
      const minimal: GenerateWorkflowArgs = { description: 'test' };
      expect(minimal.description).toBe('test');
      expect(minimal.skip_cache).toBeUndefined();

      const withSkip: GenerateWorkflowArgs = { description: 'test', skip_cache: true };
      expect(withSkip.skip_cache).toBe(true);
    });
  });
});
