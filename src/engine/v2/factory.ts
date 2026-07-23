import { AssessmentController } from '../../controllers/v2/AssessmentController';
import { AssessmentService } from '../../services/v2/AssessmentService';
import { SessionManager } from './session/SessionManager';
import { SessionLoader } from './session/SessionLoader';
import { SessionSaver } from './session/SessionSaver';
import { SessionMerger } from './session/SessionMerger';
import { SessionProgress } from './session/SessionProgress';
import { SessionTimeline } from './session/SessionTimeline';
import { SessionStateMachine } from './session/SessionStateMachine';
import { SessionRecovery } from './session/SessionRecovery';
import { SessionValidator } from './session/SessionValidator';
import { InMemorySessionRepository } from './session/InMemorySessionRepository';
import fs from 'fs';
import path from 'path';
import { IConfigurationLoader } from './interfaces/dependencies';
import { ConfigurationBundle, GrantGraph, RuleGraph, QuestionGraph } from './config/interfaces';
import { GrantEngine } from './evaluators/GrantEngine';
import { MissingDataResolver } from './evaluators/MissingDataResolver';
import { RankingEngine } from './services/RankingEngine';
import { ResultBuilder } from './services/ResultBuilder';
import { AcraEnrichmentService } from '../../services/v2/AcraEnrichmentService';
import { CompanyProfileNormalizer } from '../../services/v2/CompanyProfileNormalizer';

class LocalJsonConfigLoader implements IConfigurationLoader {
  async loadActiveConfiguration(versionId?: string): Promise<ConfigurationBundle> {
    const grantsFilePath = path.join(__dirname, '../../data/grants.json');
    const questionsFilePath = path.join(__dirname, '../../data/questions.json');
    
    const rawGrants = JSON.parse(fs.readFileSync(grantsFilePath, 'utf-8'));
    const rawQuestions = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));
    
    const questionMap = new Map<string, QuestionGraph>();
    const mapQuestion = (q: any): QuestionGraph => {
      const qg = { ...q, questionId: q.id };
      if (q.fieldName) questionMap.set(q.fieldName, qg);
      if (q.followUpQuestions) {
        qg.followUpQuestions = q.followUpQuestions.map((subQ: any) => mapQuestion(subQ));
      }
      return qg;
    };
    const questions: QuestionGraph[] = rawQuestions.map(mapQuestion);

    const grants: GrantGraph[] = rawGrants.map((g: any) => {
      const rules: RuleGraph[] = (g.conditions || []).map((c: any, i: number) => {
        const opMap: Record<string, string> = {
          '<': 'less_than',
          '>': 'greater_than',
          '<=': 'less_than_or_equals',
          '>=': 'greater_than_or_equals',
          '=': 'equals',
          '==': 'equals',
          '===': 'equals'
        };
        const mappedOp = opMap[c.operator] || c.operator;

        const ruleGraph: any = {
          ruleId: `${g.id}-rule-${i}`,
          fieldPath: c.field,
          operator: mappedOp,
          value: c.value,
          errorMessage: c.expectedMessage
        };
        // Restore mapping: link rule to question via field name
        const matchingQuestion = questionMap.get(c.field);
        if (matchingQuestion) {
          ruleGraph.question = matchingQuestion;
        }
        
        return ruleGraph;
      });
      
      return {
        ...g,
        ruleGroup: {
          groupId: `${g.id}-root-group`,
          condition: 'AND',
          rules,
          nestedGroups: []
        }
      };
    });
    
    const bundle = {
      grants,
      ruleGroups: [],
      rules: [],
      questions,
      prompts: [],
      configs: []
    };

    // Lightweight Configuration Integrity Validation
    const step12Fields = new Set([
      'dynamicAnswers.localShareholding',
      'dynamicAnswers.financiallyViable',
      'dynamicAnswers.currentRatio',
      'dynamicAnswers.retainedEarnings',
      'dynamicAnswers.investorCapital',
      'dynamicAnswers.isSme',
      'dynamicAnswers.isCitizenOrPR',
      'dynamicAnswers.eligibleSector',
      'dynamicAnswers.firstBusiness'
    ]);

    const collectedByChat = new Set<string>();
    const missingSource = new Set<string>();

    grants.forEach(g => {
      g.ruleGroup.rules.forEach((r: any) => {
        const field = r.fieldPath;
        if (questionMap.has(field)) {
          collectedByChat.add(field);
        } else if (!step12Fields.has(field)) {
          missingSource.add(field);
        }
      });
    });

    if (missingSource.size > 0) {
      console.warn('⚠️ CONFIGURATION INTEGRITY WARNING ⚠️');
      console.warn('The following grant condition fields have NO question and NO Step 1/2 source:');
      missingSource.forEach(f => console.warn(` - ${f}`));
    }

    return bundle;
  }
}

import { GrantEvaluator } from './evaluators/GrantEvaluator';

class StubVersionResolver { async resolveVersion() { return 'latest'; } }
class StubValidationLayer { async validate() { return true; } }

export class V2Factory {
  public static createAssessmentController(): AssessmentController {
    const sessionRepo = new InMemorySessionRepository();
    const sessionValidator = new SessionValidator();
    
    const sessionLoader = new SessionLoader(sessionRepo, sessionValidator);
    const sessionSaver = new SessionSaver(sessionRepo, sessionValidator);
    const sessionMerger = new SessionMerger();
    const sessionProgress = new SessionProgress();
    const sessionTimeline = new SessionTimeline();
    const sessionStateMachine = new SessionStateMachine();
    const sessionRecovery = new SessionRecovery();

    const sessionManager = new SessionManager(
      sessionLoader,
      sessionSaver,
      sessionMerger,
      sessionProgress,
      sessionTimeline,
      sessionStateMachine,
      sessionRecovery
    );

    const configLoader = new LocalJsonConfigLoader();
    const missingDataResolver = new MissingDataResolver();
    const rankingEngine = new RankingEngine();
    const resultBuilder = new ResultBuilder();
    
    const grantEngine = new GrantEngine(
      configLoader,
      new StubVersionResolver() as any,
      new StubValidationLayer() as any,
      GrantEvaluator,
      missingDataResolver,
      rankingEngine,
      resultBuilder
    );

    const assessmentService = new AssessmentService(
      sessionManager,
      configLoader,
      grantEngine,
      missingDataResolver,
      rankingEngine,
      resultBuilder
    );

    const acraService = new AcraEnrichmentService();
    const normalizerService = new CompanyProfileNormalizer();

    return new AssessmentController(assessmentService, acraService, normalizerService);
  }
}
