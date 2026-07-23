import { ConfigurationBundle, GrantGraph } from '../config/interfaces';
import { 
  EvaluationContext, 
  GrantEvaluationResult, 
  MissingDataBundle, 
  RankingResult 
} from './execution';
import { AssessmentSessionState } from './execution';

// Placeholder Interfaces for Dependency Injection

export interface IConfigurationLoader {
  loadActiveConfiguration(versionId?: string): Promise<ConfigurationBundle>;
}

export interface IVersionResolver {
  resolveVersion(context: EvaluationContext): Promise<string>;
}

export interface IValidationLayer {
  validate(payload: Readonly<Record<string, any>>): Promise<boolean>;
}

export interface IMissingDataResolver {
  resolve(
    evaluations: GrantEvaluationResult[], 
    configBundle: ConfigurationBundle
  ): Promise<MissingDataBundle>;
}

export interface IRankingEngine {
  rank(grants: GrantEvaluationResult[]): Promise<RankingResult>;
}

export interface IResultBuilder {
  build(
    context: EvaluationContext,
    metrics: EngineMetrics,
    eligible: GrantEvaluationResult[], 
    potentiallyEligible: GrantEvaluationResult[], 
    rejected: GrantEvaluationResult[], 
    errors: GrantEvaluationResult[],
    missingData?: MissingDataBundle,
    ranking?: RankingResult
  ): Promise<any>;
}

export interface IGrantEvaluator {
  evaluate(
    grant: GrantGraph,
    context: EvaluationContext,
    cache: { rules: Map<string, any>; groups: Map<string, any> },
    groupEvaluator: any
  ): GrantEvaluationResult;
}

// Engine Result DTO

export interface EngineMetrics {
  executionTimeMs: number;
  totalGrants: number;
  eligibleCount: number;
  potentialCount: number;
  rejectedCount: number;
  errorCount: number;
  missingQuestionCount: number;
  configurationVersion: string;
  evaluationTimestamp: Date;
}

export interface EngineResult {
  eligible: GrantEvaluationResult[];
  potentiallyEligible: GrantEvaluationResult[];
  rejected: GrantEvaluationResult[];
  errors: GrantEvaluationResult[];
  missingData?: MissingDataBundle;
  ranking?: RankingResult;
  metrics: EngineMetrics;
  sessionState: AssessmentSessionState;
  finalPayload?: any; // The formatted client response
}
