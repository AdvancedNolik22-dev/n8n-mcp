// Matches the McpToolResponse format from handlers-n8n-manager.ts
export interface OperationResultData {
  success: boolean;
  data?: {
    id?: string;
    name?: string;
    active?: boolean;
    nodeCount?: number;
    workflowId?: string;
    workflowName?: string;
    deleted?: boolean;
    operationsApplied?: number;
    [key: string]: unknown;
  };
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface ValidationError {
  type?: string;
  property?: string;
  message: string;
  fix?: string;
  node?: string;
  details?: unknown;
}

export interface ValidationWarning {
  type?: string;
  property?: string;
  message: string;
  node?: string;
  details?: unknown;
}

// Matches the validate_node / validate_workflow response format from server.ts
export interface ValidationSummaryData {
  valid: boolean;
  nodeType?: string;
  displayName?: string;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions?: string[];
  summary?: {
    errorCount?: number;
    warningCount?: number;
    hasErrors?: boolean;
    suggestionCount?: number;
    [key: string]: unknown;
  };
  // n8n_validate_workflow wraps result in success/data
  success?: boolean;
  data?: {
    valid?: boolean;
    workflowId?: string;
    workflowName?: string;
    errors?: ValidationError[];
    warnings?: ValidationWarning[];
    suggestions?: string[];
    summary?: {
      errorCount?: number;
      warningCount?: number;
      [key: string]: unknown;
    };
  };
}
