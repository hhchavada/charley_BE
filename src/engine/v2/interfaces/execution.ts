import { ConfigurationBundle, GrantGraph, QuestionGraph, RuleGraph, RuleGroupGraph } from '../../config/interfaces';

// ==========================================
// 1. STATE MACHINES & ENUMS
// ==========================================

export enum AssessmentSessionState {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  WAITING_FOR_AI = 'WAITING_FOR_AI',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  RE_EVALUATING = 'RE_EVALUATING',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export enum EvaluationState {
  PASS = 'PASS',
  FAIL = 'FAIL',
  MISSING = 'MISSING',
  SKIPPED = 'SKIPPED',
  ERROR = 'ERROR',
  UNKNOWN = 'UNKNOWN'
}

export enum GrantState {
  ELIGIBLE = 'ELIGIBLE',
  POTENTIALLY_ELIGIBLE = 'POTENTIALLY_ELIGIBLE',
  NEEDS_INFORMATION = 'NEEDS_INFORMATION',
  NOT_ELIGIBLE = 'NOT_ELIGIBLE',
  ERROR = 'ERROR'
}

// ==========================================
// 2. CONTEXTS
// ==========================================

export interface EvaluationContext {
  payload: Record<string, any>; // The raw company data provided by the form/AI
  sessionId: string;
  versionId: string;
}

export interface EngineContext {
  evaluationCtx: EvaluationContext;
  configBundle: ConfigurationBundle; // The frozen, fully resolved graph of rules/grants
  cache: {
    rules: Map<string, EvaluationState>; // Memoized rule evaluation results
    groups: Map<string, EvaluationState>; // Memoized group results
  };
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  state: AssessmentSessionState;
  collectedData: Record<string, any>;
  matchedGrants: string[]; // Grant IDs
  missingQuestions: string[]; // Question IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface VersionContext {
  versionId: string;
  lockedAt: Date;
  isArchived: boolean;
}

export interface AIContext {
  sessionId: string;
  missingDataBundle: MissingDataBundle;
  promptTemplateId: string;
  systemPromptResolved: string; // The fully injected prompt string
}

// ==========================================
// 3. REQUESTS & RESPONSES
// ==========================================

export interface EvaluationRequest {
  payload: Record<string, any>;
  sessionId?: string; // If resuming an existing session
}

export interface EvaluationResponse {
  sessionId: string;
  state: AssessmentSessionState;
  eligibleGrants: GrantEvaluationResult[];
  ineligibleGrants: GrantEvaluationResult[];
  needsInfoGrants: GrantEvaluationResult[];
  missingDataBundle?: MissingDataBundle;
  rankingResult: RankingResult;
}

export interface MissingQuestionDTO {
  questionId: string;
  fieldPath: string;
  priority: number;
  aiContext?: string;
  systemHint?: string;
  semanticCategory?: string;
  expectedAnswerType?: string;
  confidenceWeight?: number;
  title?: string;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, any>;
  fieldName?: string;
  embeddingId?: string;
  knowledgeBaseReference?: string;
  promptTemplateId?: string;
  conversationStage?: string;
  dependsOn?: string[];
  visibilityCondition?: Record<string, any>;
  requiredWhen?: Record<string, any>;
  followupQuestion?: string;
  affectedGrantCount: number;
  affectedGrantIds: string[];
  affectedRuleIds: string[];
  importance: 'HIGH' | 'MEDIUM' | 'LOW';
  completionImpact: number;
  estimatedFundingImpact: number;
}

export interface QuestionGroupDTO {
  groupId: string;
  name: string;
  order: number;
  questions: MissingQuestionDTO[];
}

export interface MissingDataDiagnostics {
  warnings: string[];
  brokenReferences: string[];
  invalidQuestions: string[];
}

export interface MissingDataStatistics {
  totalMissingRules: number;
  totalQuestions: number;
  deduplicatedQuestions: number;
  affectedGrants: number;
  highPriorityQuestions: number;
  averageCompletion: number;
}

export interface MissingDataBundle {
  questions: MissingQuestionDTO[];
  groups: QuestionGroupDTO[];
  statistics: MissingDataStatistics;
  diagnostics: MissingDataDiagnostics;
  completionPercentage: number;
  estimatedUnlockableGrants: number;
  estimatedUnlockableFunding: number;
}

// ==========================================
// 4. RESULTS
// ==========================================

export interface RuleEvaluationResult {
  ruleId: string;
  state: EvaluationState;
  evaluatedValue?: any;
  errorMessage?: string;
}

export interface RuleGroupEvaluationResult {
  groupId: string;
  state: EvaluationState;
  ruleResults: RuleEvaluationResult[];
  nestedGroupResults: RuleGroupEvaluationResult[];
  executionTimeMs?: number;
}

export interface GrantEvaluationResult {
  grant: GrantGraph;
  state: GrantState;
  score: number;
  rootGroupResult: RuleGroupEvaluationResult;
  matchedRulesCount: number;
  failedRulesCount: number;
  missingRulesCount: number;
  matchedRuleIds?: string[];
  failedRuleIds?: string[];
  missingRuleIds?: string[];
  completionPercentage: number;
  ruleCoverage: number;
  explanation: {
    reasonSummary: string;
    failureSummary: string;
    missingSummary: string;
  };
  executionTimeMs: number;
}

export interface RankedGrantDTO {
  grantResult: GrantEvaluationResult;
  recommendationScore: number;
  badges: string[];
  isMergedCard: boolean;
  mergedStreams?: GrantEvaluationResult[];
  recommendedStream?: GrantEvaluationResult;
  windowStatus?: 'OPEN' | 'CLOSED' | 'COMING_SOON' | 'EXPIRED';
  stacksWithOtherGrants?: boolean;
  whyRanked?: string;
  whyHidden?: string;
  whyRecommended?: string;
  humanSummary?: string;
  AIExplanation?: string;
}

export interface FundingSummary {
  estimatedFunding: number;
  maximumFunding: number;
  fundingRange: string;
  supportPercentage: string;
  fundingType: string;
  grantCategory: string;
  processingTime: string;
}

export interface RankingStatistics {
  totalRanked: number;
  mergedCardsCount: number;
  totalEstimatedFunding: number;
}

export interface RankingDiagnostics {
  duplicatePriority: string[];
  missingConfiguration: string[];
  invalidStream: string[];
  brokenMergeRule: string[];
  windowConflict: string[];
}

export interface RankingResult {
  readyNow: RankedGrantDTO[];
  needsInformation: RankedGrantDTO[];
  prepareNext: RankedGrantDTO[];
  windowClosed: RankedGrantDTO[];
  hidden: RankedGrantDTO[];
  statistics: RankingStatistics;
  fundingSummary: FundingSummary;
  diagnostics: RankingDiagnostics;
}
