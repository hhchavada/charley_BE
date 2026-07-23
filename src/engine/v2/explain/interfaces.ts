export interface RuleExplanation {
  ruleId: string;
  field: string;
  operator: string;
  expectedValue: any;
  actualValue: any;
  result: 'PASS' | 'FAIL' | 'MISSING' | 'ERROR';
  humanReadable: string;
}

export interface GrantExplanation {
  grantId: string;
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'POTENTIALLY_ELIGIBLE';
  passedRules: RuleExplanation[];
  failedRules: RuleExplanation[];
  missingRules: RuleExplanation[];
  confidenceScore: number;
  coveragePercentage: number;
  reasoning: string;
}

export interface DecisionTraceNode {
  type: 'GRANT' | 'GROUP' | 'RULE';
  id: string;
  operator?: 'AND' | 'OR';
  result: 'PASS' | 'FAIL' | 'MISSING' | 'ERROR';
  children?: DecisionTraceNode[];
  details?: string;
}

export interface ScenarioDiff {
  newlyQualifiedGrants: string[];
  lostGrants: string[];
  fundingDifference: number;
  ruleDifferences: Record<string, any>;
  questionDifferences: string[];
}
