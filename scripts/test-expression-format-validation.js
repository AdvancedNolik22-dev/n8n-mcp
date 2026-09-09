#!/usr/bin/env node

/**
 * Test script for expression format validation
 * Tests the validation of expression prefixes and resource locator formats
 */

const { WorkflowValidator } = require('../dist/services/workflow-validator.js');
const { NodeRepository } = require('../dist/database/node-repository.js');
const { EnhancedConfigValidator } = require('../dist/services/enhanced-config-validator.js');
const { createDatabaseAdapter } = require('../dist/database/database-adapter.js');
const path = require('path');

async function runTests() {
  // Initialize database
  const dbPath = path.join(__dirname, '..', 'data', 'nodes.db');
  const adapter = await createDatabaseAdapter(dbPath);
  const db = adapter;

  const nodeRepository = new NodeRepository(db);
  const validator = new WorkflowValidator(nodeRepository, EnhancedConfigValidator);

  console.log('\n🧪 Testing Expression Format Validation\n');
  console.log('=' .repeat(60));

  // Test 1: Email node with missing = prefix
  console.log('\n📝 Test 1: Email Send node - Missing = prefix');
  console.log('-'.repeat(40));

  const emailWorkflowIncorrect = {
    nodes: [
      {
        id: 'b9dd1cfd-ee66-4049-97e7-1af6d976a4e0',
        name: 'Error Handler',
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2.1,
        position: [-128, 400],
        parameters: {
          fromEmail: '{{ $env.ADMIN_EMAIL }}',  // INCORRECT - missing =
          toEmail: 'admin@company.com',
          subject: 'GitHub Issue Workflow Error - HIGH PRIORITY',
          options: {}
        },
        credentials: {
          smtp: {
            id: '7AQ08VMFHubmfvzR',
            name: 'advancednolik22@gmail.com'
          }
        }
      }
    ],
    connections: {}
  };

  const result1 = await validator.validateWorkflow(emailWorkflowIncorrect);

  if (result1.errors.some(e => e.message.includes('Expression format'))) {
    console.log('✅ ERROR DETECTED (correct behavior):');
    const formatError = result1.errors.find(e => e.message.includes('Expression format'));
    console.log('\n' + formatError.message);
  } else {
    console.log('❌ No expression format error detected (should have detected missing prefix)');
  }

  // Test 2: Email node with correct = prefix
  console.log('\n📝 Test 2: Email Send node - Correct = prefix');
  console.log('-'.repeat(40));

  const emailWorkflowCorrect = {
    nodes: [
      {
        id: 'b9dd1cfd-ee66-4049-97e7-1af6d976a4e0',
        name: 'Error Handler',
        type: 'n8n-nodes-base.emailSend',
        typeVersion: 2.1,
        position: [-128, 400],
        parameters: {
          fromEmail: '={{ $env.ADMIN_EMAIL }}',  // CORRECT - has =
          toEmail: 'admin@company.com',
          subject: 'GitHub Issue Workflow Error - HIGH PRIORITY',
          options: {}
        }
      }
    ],
    connections: {}
  };

  const result2 = await validator.validateWorkflow(emailWorkflowCorrect);

  if (result2.errors.some(e => e.message.includes('Expression format'))) {
    console.log('❌ Unexpected expression format error (should accept = prefix)');
  } else {
    console.log('✅ No expression format errors (correct!)');
  }

  // Test 3: GitHub node without resource locator format
  console.log('\n📝 Test 3: GitHub node - Missing resource locator format');
  console.log('-'.repeat(40));

  const githubWorkflowIncorrect = {
    nodes: [
      {
        id: '3c742ca1-af8f-4d80-a47e-e68fb1ced491',
        name: 'Send Welcome Comment',
        type: 'n8n-nodes-base.github',
        typeVersion: 1.1,
        position: [-240, 96],
        parameters: {
          operation: 'createComment',
          owner: '{{ $vars.GITHUB_OWNER }}',  // INCORRECT - needs RL format
          repository: '{{ $vars.GITHUB_REPO }}',  // INCORRECT - needs RL format
          issueNumber: null,
          body: '👋 Hi @{{ $(\'Extract Issue Data\').first().json.author }}!'  // INCORRECT - missing =
        },
        credentials: {
          githubApi: {
            id: 'edgpwh6ldYN07MXx',
            name: 'GitHub account'
          }
        }
      }
    ],
    connections: {}
  };

  const result3 = await validator.validateWorkflow(githubWorkflowIncorrect);

  const formatErrors = result3.errors.filter(e => e.message.includes('Expression format'));
  console.log(`\nFound ${formatErrors.length} expression format errors:`);

  if (formatErrors.length >= 3) {
    console.log('✅ All format issues detected:');
    formatErrors.forEach((error, index) => {
      const field = error.message.match(/Field '([^']+)'/)?.[1] || 'unknown';
      console.log(`  ${index + 1}. Field '${field}' - ${error.message.includes('resource locator') ? 'Needs RL format' : 'Missing = prefix'}`);
    });
  } else {
    console.log('❌ Not all format issues detected');
  }

  // Test 4: GitHub node with correct resource locator format
  console.log('\n📝 Test 4: GitHub node - Correct resource locator format');
  console.log('-'.repeat(40));

  const githubWorkflowCorrect = {
    nodes: [
      {
        id: '3c742ca1-af8f-4d80-a47e-e68fb1ced491',
        name: 'Send Welcome Comment',
        type: 'n8n-nodes-base.github',
        typeVersion: 1.1,
        position: [-240, 96],
        parameters: {
          operation: 'createComment',
          owner: {
            __rl: true,
            value: '={{ $vars.GITHUB_OWNER }}',  // CORRECT - RL format with =
            mode: 'expression'
          },
          repository: {
            __rl: true,
            value: '={{ $vars.GITHUB_REPO }}',  // CORRECT - RL format with =
            mode: 'expression'
          },
          issueNumber: 123,
          body: '=👋 Hi @{{ $(\'Extract Issue Data\').first().json.author }}!'  // CORRECT - has =
        }
      }
    ],
    connections: {}
  };

  const result4 = await validator.validateWorkflow(githubWorkflowCorrect);

  const formatErrors4 = result4.errors.filter(e => e.message.includes('Expression format'));
  if (formatErrors4.length === 0) {
    console.log('✅ No expression format errors (correct!)');
  } else {
    console.log(`❌ Unexpected expression format errors: ${formatErrors4.length}`);
    formatErrors4.forEach(e => console.log('  - ' + e.message.split('\n')[0]));
  }

  // Test 5: Mixed content expressions
  console.log('\n📝 Test 5: Mixed content with expressions');
  console.log('-'.repeat(40));

  const mixedContentWorkflow = {
    nodes: [
      {
        id: '1',
        name: 'HTTP Request',
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 4,
        position: [0, 0],
        parameters: {
          url: 'https://api.example.com/users/{{ $json.userId }}',  // INCORRECT
          headers: {
            'Authorization': '=Bearer {{ $env.API_TOKEN }}'  // CORRECT
          }
        }
      }
    ],
    connections: {}
  };

  const result5 = await validator.validateWorkflow(mixedContentWorkflow);

  const urlError = result5.errors.find(e => e.message.includes('url') && e.message.includes('Expression format'));
  if (urlError) {
    console.log('✅ Mixed content error detected for URL field');
    console.log('  Should be: "=https://api.example.com/users/{{ $json.userId }}"');
  } else {
    console.log('❌ Mixed content error not detected');
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ Expression Format Validation Summary:');
  console.log('  - Detects missing = prefix in expressions');
  console.log('  - Identifies fields needing resource locator format');
  console.log('  - Provides clear correction examples');
  console.log('  - Handles mixed literal and expression content');

  // Close database
  db.close();
}

runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});