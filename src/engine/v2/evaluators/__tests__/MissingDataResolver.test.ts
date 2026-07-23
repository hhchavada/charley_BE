import { MissingDataResolver } from '../MissingDataResolver';
import { GrantEvaluationResult, EvaluationState } from '../../interfaces/execution';
import { ConfigurationBundle, GrantGraph, QuestionGraph, RuleGroupGraph, RuleGraph } from '../../config/interfaces';

describe('MissingDataResolver', () => {
  const resolver = new MissingDataResolver();

  const createQuestion = (id: string, category?: string, priority?: number): QuestionGraph => ({
    questionId: id,
    title: 'Test',
    type: 'text',
    fieldMapping: id,
    semanticCategory: category,
    priority
  } as any);

  const createRule = (id: string, questionId: string): RuleGraph => ({
    ruleId: id,
    name: 'Rule',
    fieldPath: id,
    operator: 'equals',
    severity: 'BLOCKING',
    weight: 1,
    question: createQuestion(questionId)
  });

  const createConfigBundle = (): ConfigurationBundle => ({
    grants: [
      {
        grantId: 'g1',
        ruleGroup: {
          groupId: 'rg1',
          logic: 'AND',
          rules: [createRule('r1', 'q1'), createRule('r2', 'q2')],
          nestedGroups: []
        }
      } as any,
      {
        grantId: 'g2',
        ruleGroup: {
          groupId: 'rg2',
          logic: 'AND',
          rules: [createRule('r3', 'q1')], // Shares q1 with g1
          nestedGroups: []
        }
      } as any
    ],
    questionFlows: [],
    promptTemplates: {},
    systemConfigs: {}
  });

  const createEvalResult = (grantId: string, missingRuleIds: string[]): GrantEvaluationResult => {
    const ruleResults = missingRuleIds.map(id => ({ ruleId: id, state: EvaluationState.MISSING }));
    return {
      grant: { grantId } as GrantGraph,
      state: null as any,
      score: 0,
      matchedRulesCount: 0,
      failedRulesCount: 0,
      missingRulesCount: missingRuleIds.length,
      completionPercentage: 0,
      ruleCoverage: 0,
      explanation: {} as any,
      executionTimeMs: 0,
      rootGroupResult: {
        groupId: 'rg',
        state: EvaluationState.MISSING,
        ruleResults,
        nestedGroupResults: []
      }
    };
  };

  it('deduplicates missing questions across multiple grants and rules', async () => {
    const config = createConfigBundle();
    const evals = [
      createEvalResult('g1', ['r1', 'r2']), // r1 maps to q1, r2 to q2
      createEvalResult('g2', ['r3'])        // r3 maps to q1
    ];

    const result = await resolver.resolve(evals, config);

    expect(result.questions).toHaveLength(2); // q1 and q2
    const q1 = result.questions.find(q => q.questionId === 'q1')!;
    
    // q1 should track both grants and both rules
    expect(q1.affectedGrantCount).toBe(2);
    expect(q1.affectedGrantIds).toContain('g1');
    expect(q1.affectedGrantIds).toContain('g2');
    expect(q1.affectedRuleIds).toContain('r1');
    expect(q1.affectedRuleIds).toContain('r3');
  });

  it('sorts questions by priority then by affected grant count', async () => {
    const config = createConfigBundle();
    config.grants[0].ruleGroup.rules[0].question = createQuestion('q1', undefined, 2); // lower priority
    config.grants[0].ruleGroup.rules[1].question = createQuestion('q2', undefined, 10); // high priority

    const evals = [createEvalResult('g1', ['r1', 'r2']), createEvalResult('g2', ['r3'])];
    const result = await resolver.resolve(evals, config);

    // q2 has priority 10, q1 has priority 2
    expect(result.questions[0].questionId).toBe('q2');
    expect(result.questions[1].questionId).toBe('q1');
  });

  it('groups questions intelligently', async () => {
    const config = createConfigBundle();
    config.grants[0].ruleGroup.rules[0].question = createQuestion('q1', 'Financials');
    config.grants[0].ruleGroup.rules[1].question = createQuestion('q2', 'Operations');

    const evals = [createEvalResult('g1', ['r1', 'r2'])];
    const result = await resolver.resolve(evals, config);

    expect(result.groups).toHaveLength(2);
    expect(result.groups.find(g => g.name === 'Financials')).toBeDefined();
    expect(result.groups.find(g => g.name === 'Operations')).toBeDefined();
  });

  it('collects diagnostics for broken references', async () => {
    const config = createConfigBundle();
    // Rule in evaluation that doesn't exist in config bundle (or has no question attached)
    const evals = [createEvalResult('g1', ['ghost_rule'])];

    const result = await resolver.resolve(evals, config);

    expect(result.questions).toHaveLength(0);
    expect(result.diagnostics.brokenReferences.length).toBe(1);
    expect(result.diagnostics.brokenReferences[0]).toContain('ghost_rule');
  });

  it('generates correct statistics', async () => {
    const config = createConfigBundle();
    config.grants[0].ruleGroup.rules[1].question = createQuestion('q2', undefined, 10); // Priority >= 8 is HIGH

    const evals = [createEvalResult('g1', ['r1', 'r2']), createEvalResult('g2', ['r3'])];
    const result = await resolver.resolve(evals, config);

    expect(result.statistics.totalMissingRules).toBe(3); // r1, r2, r3
    expect(result.statistics.deduplicatedQuestions).toBe(2);
    expect(result.statistics.affectedGrants).toBe(2);
    expect(result.statistics.highPriorityQuestions).toBe(1); // q2
  });
});
