import { SessionMerger } from './src/engine/v2/session/SessionMerger';
import { RuleEvaluator } from './src/engine/v2/evaluators/RuleEvaluator';

const merger = new SessionMerger();
const existingPayload = {
  purpose: ['Business Growth', 'Developing New Products'],
  dynamicAnswers: {}
};
const incomingAnswer = {
  'dynamicAnswers.localShareholding': '25',
  'dynamicAnswers.marketingType': 'Website'
};

console.log('1. Payload entering submitAnswers():', incomingAnswer);
const merged = merger.merge(existingPayload, incomingAnswer);
console.log('2. Payload after SessionMerger:', JSON.stringify(merged, null, 2));

const evaluationContextPayload = {
  initialData: merged,
  ...merged
};
console.log('4. Payload inside EvaluationContext:', JSON.stringify(evaluationContextPayload, null, 2));

const extractedLocalShareholding = (RuleEvaluator as any).getNestedValue(evaluationContextPayload, 'dynamicAnswers.localShareholding');
console.log('5. RuleEvaluator runtime value after fix (localShareholding):', extractedLocalShareholding);
