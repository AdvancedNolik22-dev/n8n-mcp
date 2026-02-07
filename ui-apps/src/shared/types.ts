export interface OperationResultData {
  status: 'success' | 'error';
  operation: string;
  workflowName?: string;
  workflowId?: string;
  timestamp?: string;
  message?: string;
  changes?: {
    nodesAdded?: string[];
    nodesModified?: string[];
    nodesRemoved?: string[];
  };
  details?: Record<string, unknown>;
}

export interface ValidationError {
  type: string;
  property?: string;
  message: string;
  fix?: string;
}

export interface ValidationWarning {
  type: string;
  property?: string;
  message: string;
}

export interface ValidationSummaryData {
  valid: boolean;
  errorCount: number;
  warningCount: number;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
  nodeType?: string;
  displayName?: string;
}
