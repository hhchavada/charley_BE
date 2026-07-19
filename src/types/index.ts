export interface CompanyData {
  companyName: string;
  country: string;
  industry: string;
  employees: number;
  annualRevenue: number;
  businessStage: string;
  dynamicAnswers: Record<string, any>;
}

export type Operator = 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';

export interface QuestionCondition {
  field: string;
  operator: Operator;
  value: any;
}

export interface Question {
  id: string;
  label: string;
  type: 'dropdown' | 'radio' | 'checkbox' | 'number' | 'text';
  options?: string[];
  required: boolean;
  fieldKey: string;
  condition?: QuestionCondition;
}

export interface Rule {
  field: string;
  operator: Operator;
  value?: any;
}

export interface Grant {
  id: string;
  name: string;
  priority: number;
  estimatedFunding: string;
  conditions: Rule[];
}

export interface RuleResult {
  rule: Rule;
  status: 'Matched' | 'Missing' | 'Rejected';
  message: string;
}

export interface MatchResult {
  grant: Grant;
  status: 'Qualified' | 'Not Qualified' | 'Needs More Information';
  ruleResults: RuleResult[];
}


