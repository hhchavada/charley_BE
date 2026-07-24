import { RuleEvaluator } from './src/engine/v2/evaluators/RuleEvaluator';

const operators = [
  'equals', 'not_equals', 'greater_than', 'greater_than_or_equals',
  'less_than', 'less_than_or_equals', 'contains', 'in', 'not_in', 'exists'
];

const values = [
  { name: 'undefined', val: undefined },
  { name: 'null', val: null },
  { name: 'empty string', val: '' },
  { name: 'empty array', val: [] }
];

console.log('--- MISSING VALUES AUDIT ---');
for (const op of operators) {
  for (const v of values) {
    const payload = { testField: v.val };
    const rule = {
      operator: op,
      fieldPath: 'testField',
      value: 'test'
    };
    try {
      const res = RuleEvaluator.evaluate(rule as any, payload);
      console.log('Operator: ' + op.padEnd(25) + ' | Value: ' + v.name.padEnd(15) + ' | State: ' + res);
    } catch (err: any) {
      console.log('Operator: ' + op.padEnd(25) + ' | Value: ' + v.name.padEnd(15) + ' | State: ERROR (' + err.message + ')');
    }
  }
}
