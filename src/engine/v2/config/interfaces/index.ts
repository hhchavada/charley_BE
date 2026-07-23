import { GrantDTO, RuleDTO, RuleGroupDTO, QuestionDTO, PromptDTO, QuestionFlowDTO, SystemConfigDTO } from '../dto';

export interface RuleGraph extends Omit<RuleDTO, 'questionId'> {
  question?: QuestionGraph;
}

export interface RuleGroupGraph extends Omit<RuleGroupDTO, 'rules' | 'nestedGroups'> {
  rules: RuleGraph[];
  nestedGroups: RuleGroupGraph[];
}

export interface GrantGraph extends Omit<GrantDTO, 'ruleGroupId'> {
  ruleGroup: RuleGroupGraph;
}

export interface QuestionGraph extends Omit<QuestionDTO, 'followupQuestion'> {
  followupQuestion?: QuestionGraph;
}

export interface QuestionFlowGraph extends Omit<QuestionFlowDTO, 'questions'> {
  questions: QuestionGraph[];
}

export interface ConfigurationBundle {
  grants: GrantGraph[];
  questionFlows: QuestionFlowGraph[];
  promptTemplates: Record<string, PromptDTO>;
  systemConfigs: Record<string, SystemConfigDTO>;
}

export interface EvaluationContext {
  payload: Record<string, any>;
  sessionId?: string;
}

export interface VersionContext {
  versionId: string;
  lockedAt: Date;
}
