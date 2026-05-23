import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { N8NDocumentationMCPServer } from '../../../src/mcp/server';
import type { AdditionalTool } from '../../../src/types/additional-tools';
import type { InstanceContext } from '../../../src/types/instance-context';

vi.mock('../../../src/database/database-adapter');
vi.mock('../../../src/database/node-repository');
vi.mock('../../../src/templates/template-service');
vi.mock('../../../src/utils/logger');

class TestableN8NMCPServer extends N8NDocumentationMCPServer {
  public async testExecuteTool(name: string, args: any): Promise<any> {
    return (this as any).executeTool(name, args);
  }

  public testGetEnabledAdditionalTools(disabledTools: Set<string>): any[] {
    return (this as any).getEnabledAdditionalTools(disabledTools);
  }
}

describe('Additional tools hook', () => {
  beforeEach(() => {
    process.env.NODE_DB_PATH = ':memory:';
  });

  afterEach(() => {
    delete process.env.NODE_DB_PATH;
    delete process.env.DISABLED_TOOLS;
  });

  it('executes additional tool handlers with instanceContext', async () => {
    const instanceContext: InstanceContext = {
      n8nApiUrl: 'https://example.n8n.cloud',
      n8nApiKey: 'api-key',
      instanceId: 'tenant-1',
    };

    const handler = vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'ok' }],
    });

    const additionalTools: AdditionalTool[] = [
      {
        tool: {
          name: 'host_switch_instance',
          description: 'Switch active n8n instance',
          inputSchema: { type: 'object', properties: {} },
        },
        handler,
      },
    ];

    const server = new TestableN8NMCPServer(instanceContext, undefined, { additionalTools });
    const result = await server.testExecuteTool('host_switch_instance', { instanceId: 'tenant-2' });

    expect(result).toEqual({
      content: [{ type: 'text', text: 'ok' }],
    });
    expect(handler).toHaveBeenCalledWith(
      { instanceId: 'tenant-2' },
      { instanceContext },
    );
  });

  it('filters additional tools via DISABLED_TOOLS list', () => {
    const additionalTools: AdditionalTool[] = [
      {
        tool: {
          name: 'host_switch_instance',
          description: 'Switch active n8n instance',
          inputSchema: { type: 'object', properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      },
      {
        tool: {
          name: 'host_list_instances',
          description: 'List n8n instances',
          inputSchema: { type: 'object', properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      },
    ];

    const server = new TestableN8NMCPServer(undefined, undefined, { additionalTools });
    const enabled = server.testGetEnabledAdditionalTools(new Set(['host_list_instances']));

    expect(enabled.map(tool => tool.name)).toEqual(['host_switch_instance']);
  });

  it('throws when additional tool collides with built-in name', () => {
    const additionalTools: AdditionalTool[] = [
      {
        tool: {
          name: 'tools_documentation',
          description: 'Conflicting name',
          inputSchema: { type: 'object', properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      },
    ];

    expect(() => new TestableN8NMCPServer(undefined, undefined, { additionalTools }))
      .toThrow('collides with a built-in tool');
  });

  it('throws when duplicate additional tool names are provided', () => {
    const additionalTools: AdditionalTool[] = [
      {
        tool: {
          name: 'host_switch_instance',
          description: 'Switch instance',
          inputSchema: { type: 'object', properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      },
      {
        tool: {
          name: 'host_switch_instance',
          description: 'Duplicate switch instance',
          inputSchema: { type: 'object', properties: {} },
        },
        handler: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] }),
      },
    ];

    expect(() => new TestableN8NMCPServer(undefined, undefined, { additionalTools }))
      .toThrow('Duplicate additional tool');
  });
});
