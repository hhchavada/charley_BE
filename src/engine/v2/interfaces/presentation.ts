export interface AssessmentSummaryDTO {
  totalEligible: number;
  totalPotential: number;
  totalPrepareNext: number;
  totalHidden: number;
  totalRejected: number;
  overallConfidence: number;
  overallCompletion: number;
  estimatedFunding: number;
  maximumFunding: number;
  fundingRange: string;
}

export interface RecommendationDTO {
  grantId: string;
  title: string;
  headline?: string;
  subHeadline?: string;
  typicalFunding?: string;
  supportPercentage?: string;
  processingTime?: string;
  confidence: number;
  recommendationScore: number;
  badges: string[];
  status: string;
  recommendedActions: string[];
  whyRecommended?: string;
  AIExplanation?: string;
  stream?: string;
  matchedStreams?: string[];
  matchedRules?: string[];
  failedRules?: string[];
  missingFields?: string[];
  selectedStream?: string;
}

export interface PresentationQuestionDTO {
  questionId: string;
  title: string;
  description?: string;
  type: string;
  placeholder?: string;
  options?: string[];
  validation?: Record<string, any>;
  fieldName?: string;
  priority: number;
  group?: string;
  section?: string;
  AIContext?: string;
}

export interface StatisticsDTO {
  grantsEvaluated: number;
  rulesEvaluated: number;
  passedRules: number;
  failedRules: number;
  missingRules: number;
  executionTime: number;
  rankingTime: number;
  resultBuildTime: number;
}

export interface DiagnosticsDTO {
  warnings: string[];
  configurationIssues: string[];
  brokenReferences: string[];
  performanceMetrics: Record<string, any>;
}

export interface ApiErrorDTO {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
}

export interface AIContextBundleDTO {
  conversationStarter?: string;
  nextBestQuestion?: string;
  AIRecommendationSummary?: string;
  AIContextBundle?: Record<string, any>;
}

export interface FundingSummaryDTO {
  EstimatedFunding: number;
  MaximumFunding: number;
  FundingRange: string;
  SupportPercentage: string;
  FundingBreakdown: Record<string, any>;
  GrantBreakdown: Record<string, any>;
  GrantCategories: string[];
}

export interface AssessmentResultDTO {
  assessment: {
    id: string;
    version: string;
    startedAt: string;
    completedAt: string;
    duration: number;
    status: string;
  };
  session: {
    sessionId: string;
    resumeToken: string;
    conversationMode: string;
    assessmentMode: string;
    version: string;
  };
  summary: AssessmentSummaryDTO;
  recommendations: {
    readyNow: RecommendationDTO[];
    needsInformation: RecommendationDTO[];
    prepareNext: RecommendationDTO[];
    windowClosed: RecommendationDTO[];
    hidden: RecommendationDTO[];
  };
  funding: FundingSummaryDTO;
  questions: PresentationQuestionDTO[];
  statistics: StatisticsDTO;
  diagnostics?: DiagnosticsDTO;
  errors?: ApiErrorDTO[];
  aiSupport?: AIContextBundleDTO;
  metadata: {
    engineVersion: string;
    configurationVersion: string;
    assessmentVersion: string;
  };
}
