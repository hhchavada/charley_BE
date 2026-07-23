"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MissingDataResolver = void 0;
const execution_1 = require("../interfaces/execution");
class MissingDataResolver {
    async resolve(evaluations, configBundle) {
        const diagnostics = {
            warnings: [],
            brokenReferences: [],
            invalidQuestions: []
        };
        // 1. Build a lookup map of all Rules -> Questions from the ConfigurationBundle
        const ruleToQuestionMap = new Map();
        const grantUnlockMap = new Map(); // questionId -> Set of Grant IDs
        const ruleUnlockMap = new Map(); // questionId -> Set of Rule IDs
        const questionDefinitions = new Map(); // questionId -> QuestionGraph
        // Helper to traverse a rule group and build lookups
        const indexRuleGroup = (group, grantId) => {
            for (const rule of group.rules) {
                if (rule.question) {
                    questionDefinitions.set(rule.question.questionId, rule.question);
                    if (!ruleToQuestionMap.has(rule.ruleId)) {
                        ruleToQuestionMap.set(rule.ruleId, { question: rule.question, ruleIds: new Set() });
                    }
                }
            }
            for (const nested of group.nestedGroups) {
                indexRuleGroup(nested, grantId);
            }
        };
        // Index all active grants
        for (const grant of configBundle.grants) {
            indexRuleGroup(grant.ruleGroup, grant.grantId);
        }
        // 2. Scan every evaluated grant for MISSING rules
        let totalMissingRules = 0;
        const affectedGrants = new Set();
        for (const evaluation of evaluations) {
            if (evaluation.missingRulesCount > 0) {
                affectedGrants.add(evaluation.grant.grantId);
            }
            // Extract all MISSING rule IDs from this grant's evaluation tree
            const extractMissing = (node) => {
                node.ruleResults.forEach(r => {
                    if (r.state === execution_1.EvaluationState.MISSING) {
                        totalMissingRules++;
                        const mapping = ruleToQuestionMap.get(r.ruleId);
                        if (!mapping) {
                            diagnostics.brokenReferences.push(`Rule ${r.ruleId} is MISSING but has no associated QuestionGraph in configuration.`);
                            return;
                        }
                        const qId = mapping.question.questionId;
                        if (!grantUnlockMap.has(qId))
                            grantUnlockMap.set(qId, new Set());
                        grantUnlockMap.get(qId).add(evaluation.grant.grantId);
                        if (!ruleUnlockMap.has(qId))
                            ruleUnlockMap.set(qId, new Set());
                        ruleUnlockMap.get(qId).add(r.ruleId);
                    }
                });
                node.nestedGroupResults.forEach(extractMissing);
            };
            extractMissing(evaluation.rootGroupResult);
        }
        // 3. Deduplicate and construct MissingQuestionDTOs
        const missingQuestions = [];
        let highPriorityCount = 0;
        for (const [qId, grantSet] of grantUnlockMap.entries()) {
            const qDef = questionDefinitions.get(qId);
            if (!qDef) {
                diagnostics.invalidQuestions.push(`Question ${qId} mapped but definition is lost.`);
                continue;
            }
            const ruleSet = ruleUnlockMap.get(qId);
            const affectedGrantCount = grantSet.size;
            // Extract dynamic AI metadata from validation/metadata if it exists
            const aiContext = qDef.aiContext || qDef.metadata?.aiContext;
            const priority = qDef.priority || 5;
            const importance = priority >= 8 ? 'HIGH' : priority >= 4 ? 'MEDIUM' : 'LOW';
            if (importance === 'HIGH')
                highPriorityCount++;
            missingQuestions.push({
                questionId: qId,
                fieldPath: qDef.fieldMapping,
                priority,
                aiContext,
                systemHint: qDef.systemHint,
                semanticCategory: qDef.semanticCategory,
                expectedAnswerType: qDef.type,
                confidenceWeight: qDef.confidenceWeight,
                // Restored original question properties
                title: qDef.title,
                placeholder: qDef.placeholder,
                options: qDef.options,
                validation: qDef.validation,
                fieldName: qDef.fieldName || qDef.fieldMapping,
                // RAG Placeholders
                embeddingId: undefined,
                knowledgeBaseReference: undefined,
                promptTemplateId: undefined,
                conversationStage: undefined,
                // Dependencies
                dependsOn: qDef.dependsOn,
                visibilityCondition: qDef.visibilityCondition,
                requiredWhen: qDef.requiredWhen,
                followupQuestion: qDef.followupQuestion?.questionId,
                // Impact
                affectedGrantCount,
                affectedGrantIds: Array.from(grantSet),
                affectedRuleIds: Array.from(ruleSet),
                importance,
                completionImpact: affectedGrantCount * 10, // Placeholder calculation
                estimatedFundingImpact: 0 // Placeholder calculation
            });
        }
        // 4. Sort Questions (Priority -> affectedGrantCount)
        missingQuestions.sort((a, b) => {
            if (b.priority !== a.priority)
                return b.priority - a.priority;
            return b.affectedGrantCount - a.affectedGrantCount;
        });
        // 5. Intelligent Grouping
        // For now, group them by semanticCategory or create a generic group if none exists
        const groupMap = new Map();
        let groupOrder = 1;
        for (const q of missingQuestions) {
            const groupName = q.semanticCategory || 'General Information';
            const groupId = `group_${groupName.toLowerCase().replace(/\s+/g, '_')}`;
            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, {
                    groupId,
                    name: groupName,
                    order: groupOrder++,
                    questions: []
                });
            }
            groupMap.get(groupId).questions.push(q);
        }
        const groups = Array.from(groupMap.values());
        // 6. Statistics
        const statistics = {
            totalMissingRules,
            totalQuestions: questionDefinitions.size,
            deduplicatedQuestions: missingQuestions.length,
            affectedGrants: affectedGrants.size,
            highPriorityQuestions: highPriorityCount,
            averageCompletion: 0 // Placeholder
        };
        return {
            questions: missingQuestions,
            groups,
            statistics,
            diagnostics,
            completionPercentage: 0, // Computed at higher level typically
            estimatedUnlockableGrants: missingQuestions.length > 0 ? affectedGrants.size : 0,
            estimatedUnlockableFunding: 0
        };
    }
}
exports.MissingDataResolver = MissingDataResolver;
