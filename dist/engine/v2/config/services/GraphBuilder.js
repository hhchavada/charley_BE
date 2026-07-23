"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphBuilder = void 0;
class GraphBuilder {
    static build(grants, ruleGroups, rules, questions) {
        const questionMap = new Map();
        const ruleMap = new Map();
        const groupMap = new Map();
        // 1. Build Question map (handle followup references if any, though it's complex if circular)
        questions.forEach(q => {
            questionMap.set(q.questionId, { ...q });
        });
        // Handle followups
        questions.forEach(q => {
            if (q.followupQuestion) {
                const questionNode = questionMap.get(q.questionId);
                const followupNode = questionMap.get(q.followupQuestion);
                if (questionNode && followupNode) {
                    questionNode.followupQuestion = followupNode;
                }
            }
        });
        // 2. Build Rule map
        rules.forEach(r => {
            const ruleGraph = { ...r };
            if (r.questionId) {
                ruleGraph.question = questionMap.get(r.questionId);
            }
            ruleMap.set(r.ruleId, ruleGraph);
        });
        // 3. Build RuleGroup map
        ruleGroups.forEach(g => {
            groupMap.set(g.groupId, { ...g, rules: [], nestedGroups: [] });
        });
        // 4. Link Rules and Nested Groups to RuleGroups
        ruleGroups.forEach(g => {
            const groupNode = groupMap.get(g.groupId);
            g.rules.forEach(ruleId => {
                const ruleNode = ruleMap.get(ruleId);
                if (ruleNode)
                    groupNode.rules.push(ruleNode);
            });
            // We will link nested groups in a separate pass to ensure all groups exist
        });
        ruleGroups.forEach(g => {
            const groupNode = groupMap.get(g.groupId);
            g.nestedGroups.forEach(nestedId => {
                const nestedNode = groupMap.get(nestedId);
                if (nestedNode)
                    groupNode.nestedGroups.push(nestedNode);
            });
        });
        // 5. Build Grant graphs
        const grantGraphs = [];
        grants.forEach(grant => {
            const ruleGroupNode = groupMap.get(grant.ruleGroupId);
            if (ruleGroupNode) {
                grantGraphs.push({
                    ...grant,
                    ruleGroup: ruleGroupNode
                });
            }
        });
        return grantGraphs;
    }
}
exports.GraphBuilder = GraphBuilder;
