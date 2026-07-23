export interface GrantDTO {
  grantId: string;
  name: string;
  description: string;
  agency: string;
  category: string;
  priority: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  version: number;
  ruleGroupId: string;
  estimatedFunding?: string;
  supportPercentage?: string;
  timeline?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RuleDTO {
  ruleId: string;
  name: string;
  fieldPath: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'exists' | 'not_exists';
  value?: any;
  questionId?: string;
  severity: 'BLOCKING' | 'WARNING' | 'INFO';
  message?: string;
  weight: number;
  semanticDescription?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RuleGroupDTO {
  groupId: string;
  logic: 'AND' | 'OR';
  rules: string[]; // Rule IDs
  nestedGroups: string[]; // RuleGroup IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionDTO {
  questionId: string;
  title: string;
  subtitle?: string;
  type: 'text' | 'number' | 'currency' | 'dropdown' | 'multiselect' | 'radio' | 'checkbox';
  fieldMapping: string;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, any>;
  aiContext?: string;
  followupQuestion?: string; // Question ID
  createdAt?: Date;
  updatedAt?: Date;
}

export interface QuestionFlowDTO {
  flowId: string;
  step: number;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PromptDTO {
  templateId: string;
  name: string;
  systemPrompt: string;
  variables: string[];
  version: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VersionDTO {
  entityType: 'GRANT' | 'RULE' | 'RULE_GROUP' | 'QUESTION' | 'PROMPT_TEMPLATE';
  entityId: string;
  versionNumber: number;
  snapshot: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SystemConfigDTO {
  key: string;
  value: any;
  createdAt?: Date;
  updatedAt?: Date;
}
