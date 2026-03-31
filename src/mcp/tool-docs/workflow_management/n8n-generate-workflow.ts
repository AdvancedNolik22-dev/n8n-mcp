import { ToolDocumentation } from '../types';

export const n8nGenerateWorkflowDoc: ToolDocumentation = {
  name: 'n8n_generate_workflow',
  category: 'workflow_management',
  essentials: {
    description: 'Generate an n8n workflow from a natural language description using AI. Creates and deploys a ready-to-use workflow to your n8n instance.',
    keyParameters: ['description', 'skip_cache'],
    example: 'n8n_generate_workflow({description: "Send a Slack message every morning at 9am"})',
    performance: 'Network-dependent (2-15s depending on cache hit vs fresh generation)',
    tips: [
      'Include trigger type (webhook, schedule, manual) in the description',
      'Mention specific services to integrate (Slack, Gmail, Google Sheets, etc.)',
      'Use skip_cache=true to force fresh AI generation instead of cached templates',
      'Available exclusively on the hosted version of n8n-mcp'
    ]
  },
  full: {
    description: 'Generates an n8n workflow from a natural language description using AI. On the hosted service, this tool first searches a cache of 73,000+ pre-built workflows for a match, and falls back to AI-powered fresh generation for custom workflows. Generated workflows are automatically validated and error-corrected before deployment. On self-hosted instances, this tool returns a message directing users to the hosted service.',
    parameters: {
      description: { type: 'string', required: true, description: 'Clear description of what the workflow should do. Include: trigger type (webhook, schedule, manual), services to integrate (Slack, Gmail, etc.), and the logic/flow.' },
      skip_cache: { type: 'boolean', description: 'Set to true to bypass the workflow cache and force fresh AI generation. Default: false (uses cached workflows when a good match exists).' }
    },
    returns: 'Object with success, source (cache/generated), workflow_id, workflow_name, workflow_url, node_count, node_summary, and message. On self-hosted instances, returns hosted_only: true with information about the hosted service.',
    examples: [
      `// Generate a simple scheduled workflow
n8n_generate_workflow({
  description: "Send a Slack message every morning at 9am with a daily standup reminder"
})`,
      `// Generate with specific services
n8n_generate_workflow({
  description: "When a new row is added to Google Sheets, create a task in Notion and notify via email"
})`,
      `// Force fresh generation (skip cache)
n8n_generate_workflow({
  description: "Webhook that receives JSON data, transforms it, and posts to a REST API",
  skip_cache: true
})`
    ],
    useCases: [
      'Quickly create workflows from natural language descriptions',
      'Generate complex multi-service integrations',
      'Bootstrap automation projects with AI-generated workflows',
      'Create workflows without deep knowledge of n8n node configuration'
    ],
    performance: 'Cache hit: ~2s. Fresh generation: 5-15s. Both within typical MCP client timeout.',
    bestPractices: [
      'Be specific about trigger type and services in the description',
      'Review generated workflows before activating',
      'Use n8n_validate_workflow to check the generated workflow',
      'Configure credentials in n8n UI before activating',
      'Use skip_cache only when cached results do not match your needs'
    ],
    pitfalls: [
      '**Hosted-only feature** — self-hosted instances receive a redirect message',
      'Generated workflows are created in INACTIVE state',
      'Credentials must be configured manually in the n8n UI',
      'Complex workflows may need manual adjustments after generation'
    ],
    relatedTools: ['n8n_create_workflow', 'n8n_deploy_template', 'n8n_validate_workflow', 'n8n_autofix_workflow', 'search_templates']
  }
};
