export const SEED_SYSTEM_CONFIGS = [
  { key: 'version', value: '1.0.0' },
  { key: 'maintenance_mode', value: false },
];

export const SEED_PROMPTS = [
  {
    templateId: 'pt_interviewer_01',
    name: 'Standard Interviewer',
    systemPrompt: 'You are an AI grant consultant. Extract the following fields: {{missingFields}}.',
    variables: ['missingFields'],
    version: 1
  }
];

export const SEED_QUESTIONS = [
  {
    questionId: 'q_revenue',
    title: 'What is your annual revenue?',
    type: 'number',
    fieldMapping: 'annualRevenue',
    validation: { min: 0 }
  },
  {
    questionId: 'q_employees',
    title: 'How many employees do you have?',
    type: 'number',
    fieldMapping: 'employees',
    validation: { min: 0 }
  }
];

export const SEED_RULES = [
  {
    ruleId: 'r_rev_sme',
    name: 'SME Revenue Limit',
    fieldPath: 'annualRevenue',
    operator: 'less_than',
    value: 100000000,
    questionId: 'q_revenue',
    severity: 'BLOCKING',
    weight: 1
  },
  {
    ruleId: 'r_emp_sme',
    name: 'SME Employee Limit',
    fieldPath: 'employees',
    operator: 'less_than',
    value: 200,
    questionId: 'q_employees',
    severity: 'BLOCKING',
    weight: 1
  }
];

// Wait, the seeders need MongoDB ObjectIds for references, but we are using string IDs for logic.
// In our models, we used Schema.Types.ObjectId for ruleGroupId and questionId.
// We'll need the index.ts to lookup these string IDs and use their mongo _ids during insertion.
