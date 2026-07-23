export interface CompanyData {
  companyName: string;
  country: string;
  industry: string;
  employees: number;
  annualRevenue: number;
  businessStage: string;
  dynamicAnswers: Record<string, any>;
}

export type Operator = 
  | '==' | '!=' | '>' | '<' | '>=' | '<='
  | 'contains' | 'not_contains' | 'starts_with' | 'ends_with'
  | 'in' | 'not_in' | 'exists' | 'not_exists' | 'is_true' | 'is_false'
  // Legacy support for older rules
  | 'equals' | 'not_equals' | 'greater_than' | 'less_than';

export interface QuestionCondition {
  field: string;
  operator: Operator;
  value: any;
}

export interface QuestionDef {
  id: string;
  step: number;
  title: string;
  description?: string;
  type: 'text' | 'textarea' | 'number' | 'currency' | 'dropdown' | 'multiselect' | 'checkbox' | 'radio';
  placeholder?: string;
  options?: string[];
  required: boolean;
  multiple?: boolean;
  fieldName: string;
  dependsOn?: string;
  conditionLogic?: 'AND' | 'OR';
  isHidden?: boolean;
  groupId?: string;
  defaultValue?: any;
  conditions?: QuestionCondition[];
  validations?: Record<string, any>;
  followUpQuestions?: QuestionDef[];
}

export interface ValidationError {
  field: string;
  errorType: 'MISSING_REQUIRED' | 'INVALID_TYPE' | 'INVALID_SELECTION' | 'INVALID_VALUE';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface Rule {
  id?: string;
  name?: string;
  field: string;
  operator: Operator;
  value?: any;
}

export interface Grant {
  id: string;
  name: string;
  priority: number;
  estimatedFunding: string;
  typicalFunding?: string;
  officialCap?: string;
  mergeGroup?: string;
  streamPriority?: number;
  prepareNext?: boolean;
  stacksWithEverything?: boolean;
  excludeFromTotalFunding?: boolean;
  windowStatus?: 'OPEN' | 'CLOSED' | 'EXPIRED';
  compactDisplay?: boolean;
  conditions: Rule[];
}

export interface RuleResult {
  ruleId?: string;
  ruleName?: string;
  field: string;
  operator: Operator;
  expectedValue: any;
  actualValue: any;
  status: 'PASS' | 'FAIL' | 'MISSING_DATA';
}

export interface MatchResult {
  grant: Grant;
  evaluationSummary?: string;
  matchedRules: RuleResult[];
  failedRules: RuleResult[];
  missingRules: RuleResult[];
  qualificationStatus: 'Qualified' | 'Not Qualified' | 'Needs More Information';
  priority: number;
  estimatedFunding: string;
  evaluationScore?: number;
}
