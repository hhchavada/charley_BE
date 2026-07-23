"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.V2Factory = void 0;
const AssessmentController_1 = require("../../controllers/v2/AssessmentController");
const AssessmentService_1 = require("../../services/v2/AssessmentService");
const SessionManager_1 = require("./session/SessionManager");
const SessionLoader_1 = require("./session/SessionLoader");
const SessionSaver_1 = require("./session/SessionSaver");
const SessionMerger_1 = require("./session/SessionMerger");
const SessionProgress_1 = require("./session/SessionProgress");
const SessionTimeline_1 = require("./session/SessionTimeline");
const SessionStateMachine_1 = require("./session/SessionStateMachine");
const SessionRecovery_1 = require("./session/SessionRecovery");
const SessionValidator_1 = require("./session/SessionValidator");
const InMemorySessionRepository_1 = require("./session/InMemorySessionRepository");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const GrantEngine_1 = require("./evaluators/GrantEngine");
const MissingDataResolver_1 = require("./evaluators/MissingDataResolver");
const RankingEngine_1 = require("./services/RankingEngine");
const ResultBuilder_1 = require("./services/ResultBuilder");
const AcraEnrichmentService_1 = require("../../services/v2/AcraEnrichmentService");
const CompanyProfileNormalizer_1 = require("../../services/v2/CompanyProfileNormalizer");
class LocalJsonConfigLoader {
    async loadActiveConfiguration(versionId) {
        const grantsFilePath = path_1.default.join(__dirname, '../../data/grants.json');
        const questionsFilePath = path_1.default.join(__dirname, '../../data/questions.json');
        const rawGrants = JSON.parse(fs_1.default.readFileSync(grantsFilePath, 'utf-8'));
        const rawQuestions = JSON.parse(fs_1.default.readFileSync(questionsFilePath, 'utf-8'));
        const questionMap = new Map();
        const mapQuestion = (q) => {
            const qg = { ...q, questionId: q.id };
            if (q.fieldName)
                questionMap.set(q.fieldName, qg);
            if (q.followUpQuestions) {
                qg.followUpQuestions = q.followUpQuestions.map((subQ) => mapQuestion(subQ));
            }
            return qg;
        };
        const questions = rawQuestions.map(mapQuestion);
        const grants = rawGrants.map((g) => {
            const rules = (g.conditions || []).map((c, i) => {
                const opMap = {
                    '<': 'less_than',
                    '>': 'greater_than',
                    '<=': 'less_than_or_equals',
                    '>=': 'greater_than_or_equals',
                    '=': 'equals',
                    '==': 'equals',
                    '===': 'equals'
                };
                const mappedOp = opMap[c.operator] || c.operator;
                const ruleGraph = {
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
        const collectedByChat = new Set();
        const missingSource = new Set();
        grants.forEach(g => {
            g.ruleGroup.rules.forEach((r) => {
                const field = r.fieldPath;
                if (questionMap.has(field)) {
                    collectedByChat.add(field);
                }
                else if (!step12Fields.has(field)) {
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
const GrantEvaluator_1 = require("./evaluators/GrantEvaluator");
class StubVersionResolver {
    async resolveVersion() { return 'latest'; }
}
class StubValidationLayer {
    async validate() { return true; }
}
class V2Factory {
    static createAssessmentController() {
        const sessionRepo = new InMemorySessionRepository_1.InMemorySessionRepository();
        const sessionValidator = new SessionValidator_1.SessionValidator();
        const sessionLoader = new SessionLoader_1.SessionLoader(sessionRepo, sessionValidator);
        const sessionSaver = new SessionSaver_1.SessionSaver(sessionRepo);
        const sessionMerger = new SessionMerger_1.SessionMerger();
        const sessionProgress = new SessionProgress_1.SessionProgress();
        const sessionTimeline = new SessionTimeline_1.SessionTimeline();
        const sessionStateMachine = new SessionStateMachine_1.SessionStateMachine();
        const sessionRecovery = new SessionRecovery_1.SessionRecovery({}, {});
        const sessionManager = new SessionManager_1.SessionManager(sessionLoader, sessionSaver, sessionMerger, sessionProgress, sessionTimeline, sessionStateMachine, sessionRecovery);
        const configLoader = new LocalJsonConfigLoader();
        const missingDataResolver = new MissingDataResolver_1.MissingDataResolver();
        const rankingEngine = new RankingEngine_1.RankingEngine();
        const resultBuilder = new ResultBuilder_1.ResultBuilder();
        const grantEngine = new GrantEngine_1.GrantEngine(configLoader, new StubVersionResolver(), new StubValidationLayer(), GrantEvaluator_1.GrantEvaluator, missingDataResolver, rankingEngine, resultBuilder);
        const assessmentService = new AssessmentService_1.AssessmentService(sessionManager, configLoader, grantEngine, missingDataResolver, rankingEngine, resultBuilder);
        const acraService = new AcraEnrichmentService_1.AcraEnrichmentService();
        const normalizerService = new CompanyProfileNormalizer_1.CompanyProfileNormalizer();
        return new AssessmentController_1.AssessmentController(assessmentService, acraService, normalizerService);
    }
}
exports.V2Factory = V2Factory;
