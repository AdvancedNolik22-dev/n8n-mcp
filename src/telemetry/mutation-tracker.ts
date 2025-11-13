/**
 * Core mutation tracker for workflow transformations
 * Coordinates validation, classification, and metric calculation
 */

import { DiffOperation } from '../types/workflow-diff.js';
import {
  WorkflowMutationData,
  WorkflowMutationRecord,
  MutationChangeMetrics,
  MutationValidationMetrics,
  IntentClassification,
} from './mutation-types.js';
import { intentClassifier } from './intent-classifier.js';
import { mutationValidator } from './mutation-validator.js';
import { intentSanitizer } from './intent-sanitizer.js';
import { WorkflowSanitizer } from './workflow-sanitizer.js';
import { logger } from '../utils/logger.js';

/**
 * Tracks workflow mutations and prepares data for telemetry
 */
export class MutationTracker {
  private recentMutations: Array<{
    hashBefore: string;
    hashAfter: string;
    operations: DiffOperation[];
  }> = [];

  private readonly RECENT_MUTATIONS_LIMIT = 100;

  /**
   * Process and prepare mutation data for tracking
   */
  async processMutation(data: WorkflowMutationData, userId: string): Promise<WorkflowMutationRecord | null> {
    try {
      // Validate data quality
      if (!this.validateMutationData(data)) {
        logger.debug('Mutation data validation failed');
        return null;
      }

      // Sanitize workflows to remove credentials and sensitive data
      const workflowBefore = this.sanitizeFullWorkflow(data.workflowBefore);
      const workflowAfter = this.sanitizeFullWorkflow(data.workflowAfter);

      // Sanitize user intent
      const sanitizedIntent = intentSanitizer.sanitize(data.userIntent);

      // Check if should be excluded
      if (mutationValidator.shouldExclude(data)) {
        logger.debug('Mutation excluded from tracking based on quality criteria');
        return null;
      }

      // Check for duplicates
      if (
        mutationValidator.isDuplicate(
          workflowBefore,
          workflowAfter,
          data.operations,
          this.recentMutations
        )
      ) {
        logger.debug('Duplicate mutation detected, skipping tracking');
        return null;
      }

      // Generate hashes
      const hashBefore = mutationValidator.hashWorkflow(workflowBefore);
      const hashAfter = mutationValidator.hashWorkflow(workflowAfter);

      // Classify intent
      const intentClassification = intentClassifier.classify(data.operations, sanitizedIntent);

      // Calculate metrics
      const changeMetrics = this.calculateChangeMetrics(data.operations);
      const validationMetrics = this.calculateValidationMetrics(
        data.validationBefore,
        data.validationAfter
      );

      // Create mutation record
      const record: WorkflowMutationRecord = {
        userId,
        sessionId: data.sessionId,
        workflowBefore,
        workflowAfter,
        workflowHashBefore: hashBefore,
        workflowHashAfter: hashAfter,
        userIntent: sanitizedIntent,
        intentClassification,
        toolName: data.toolName,
        operations: data.operations,
        operationCount: data.operations.length,
        operationTypes: this.extractOperationTypes(data.operations),
        validationBefore: data.validationBefore,
        validationAfter: data.validationAfter,
        ...validationMetrics,
        ...changeMetrics,
        mutationSuccess: data.mutationSuccess,
        mutationError: data.mutationError,
        durationMs: data.durationMs,
      };

      // Store in recent mutations for deduplication
      this.addToRecentMutations(hashBefore, hashAfter, data.operations);

      return record;
    } catch (error) {
      logger.error('Error processing mutation:', error);
      return null;
    }
  }

  /**
   * Validate mutation data
   */
  private validateMutationData(data: WorkflowMutationData): boolean {
    const validationResult = mutationValidator.validate(data);

    if (!validationResult.valid) {
      logger.warn('Mutation data validation failed:', validationResult.errors);
      return false;
    }

    if (validationResult.warnings.length > 0) {
      logger.debug('Mutation data validation warnings:', validationResult.warnings);
    }

    return true;
  }

  /**
   * Calculate change metrics from operations
   */
  private calculateChangeMetrics(operations: DiffOperation[]): MutationChangeMetrics {
    const metrics: MutationChangeMetrics = {
      nodesAdded: 0,
      nodesRemoved: 0,
      nodesModified: 0,
      connectionsAdded: 0,
      connectionsRemoved: 0,
      propertiesChanged: 0,
    };

    for (const op of operations) {
      switch (op.type) {
        case 'addNode':
          metrics.nodesAdded++;
          break;
        case 'removeNode':
          metrics.nodesRemoved++;
          break;
        case 'updateNode':
          metrics.nodesModified++;
          if ('updates' in op && op.updates) {
            metrics.propertiesChanged += Object.keys(op.updates as any).length;
          }
          break;
        case 'addConnection':
          metrics.connectionsAdded++;
          break;
        case 'removeConnection':
          metrics.connectionsRemoved++;
          break;
        case 'rewireConnection':
          // Rewiring is effectively removing + adding
          metrics.connectionsRemoved++;
          metrics.connectionsAdded++;
          break;
        case 'replaceConnections':
          // Count how many connections are being replaced
          if ('connections' in op && op.connections) {
            metrics.connectionsRemoved++;
            metrics.connectionsAdded++;
          }
          break;
        case 'updateSettings':
          if ('settings' in op && op.settings) {
            metrics.propertiesChanged += Object.keys(op.settings as any).length;
          }
          break;
        case 'moveNode':
        case 'enableNode':
        case 'disableNode':
        case 'updateName':
        case 'addTag':
        case 'removeTag':
        case 'activateWorkflow':
        case 'deactivateWorkflow':
        case 'cleanStaleConnections':
          // These don't directly affect node/connection counts
          // but count as property changes
          metrics.propertiesChanged++;
          break;
      }
    }

    return metrics;
  }

  /**
   * Sanitize a full workflow while preserving structure
   * Removes credentials and sensitive data but keeps all nodes, connections, parameters
   */
  private sanitizeFullWorkflow(workflow: any): any {
    if (!workflow) return workflow;

    // Deep clone to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(workflow));

    // Remove sensitive workflow-level fields
    delete sanitized.credentials;
    delete sanitized.sharedWorkflows;
    delete sanitized.ownedBy;
    delete sanitized.createdBy;
    delete sanitized.updatedBy;

    // Sanitize each node
    if (sanitized.nodes && Array.isArray(sanitized.nodes)) {
      sanitized.nodes = sanitized.nodes.map((node: any) => {
        const sanitizedNode = { ...node };

        // Remove credentials field
        delete sanitizedNode.credentials;

        // Sanitize parameters if present
        if (sanitizedNode.parameters && typeof sanitizedNode.parameters === 'object') {
          sanitizedNode.parameters = this.sanitizeParameters(sanitizedNode.parameters);
        }

        return sanitizedNode;
      });
    }

    return sanitized;
  }

  /**
   * Recursively sanitize parameters object
   */
  private sanitizeParameters(params: any): any {
    if (!params || typeof params !== 'object') return params;

    const sensitiveKeys = [
      'apiKey', 'api_key', 'token', 'secret', 'password', 'credential',
      'auth', 'authorization', 'privateKey', 'accessToken', 'refreshToken'
    ];

    const sanitized: any = Array.isArray(params) ? [] : {};

    for (const [key, value] of Object.entries(params)) {
      const lowerKey = key.toLowerCase();

      // Check if key is sensitive
      if (sensitiveKeys.some(sk => lowerKey.includes(sk.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeParameters(value);
      } else if (typeof value === 'string') {
        // Sanitize string values that might contain sensitive data
        sanitized[key] = this.sanitizeStringValue(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize string values that might contain sensitive data
   */
  private sanitizeStringValue(value: string): string {
    if (!value || typeof value !== 'string') return value;

    let sanitized = value;

    // Redact URLs with authentication
    sanitized = sanitized.replace(/https?:\/\/[^:]+:[^@]+@[^\s/]+/g, '[REDACTED_URL_WITH_AUTH]');

    // Redact long API keys/tokens (20+ alphanumeric chars)
    sanitized = sanitized.replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[REDACTED_TOKEN]');

    // Redact OpenAI-style keys
    sanitized = sanitized.replace(/\bsk-[A-Za-z0-9]{32,}\b/g, '[REDACTED_APIKEY]');

    // Redact Bearer tokens
    sanitized = sanitized.replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]');

    return sanitized;
  }

  /**
   * Calculate validation improvement metrics
   */
  private calculateValidationMetrics(
    validationBefore: any,
    validationAfter: any
  ): MutationValidationMetrics {
    // If validation data is missing, return nulls
    if (!validationBefore || !validationAfter) {
      return {
        validationImproved: null,
        errorsResolved: 0,
        errorsIntroduced: 0,
      };
    }

    const errorsBefore = validationBefore.errors?.length || 0;
    const errorsAfter = validationAfter.errors?.length || 0;

    const errorsResolved = Math.max(0, errorsBefore - errorsAfter);
    const errorsIntroduced = Math.max(0, errorsAfter - errorsBefore);

    const validationImproved = errorsBefore > errorsAfter;

    return {
      validationImproved,
      errorsResolved,
      errorsIntroduced,
    };
  }

  /**
   * Extract unique operation types from operations
   */
  private extractOperationTypes(operations: DiffOperation[]): string[] {
    const types = new Set(operations.map((op) => op.type));
    return Array.from(types);
  }

  /**
   * Add mutation to recent list for deduplication
   */
  private addToRecentMutations(
    hashBefore: string,
    hashAfter: string,
    operations: DiffOperation[]
  ): void {
    this.recentMutations.push({ hashBefore, hashAfter, operations });

    // Keep only recent mutations
    if (this.recentMutations.length > this.RECENT_MUTATIONS_LIMIT) {
      this.recentMutations.shift();
    }
  }

  /**
   * Clear recent mutations (useful for testing)
   */
  clearRecentMutations(): void {
    this.recentMutations = [];
  }

  /**
   * Get statistics about tracked mutations
   */
  getRecentMutationsCount(): number {
    return this.recentMutations.length;
  }
}

/**
 * Singleton instance for easy access
 */
export const mutationTracker = new MutationTracker();
