import fs from 'fs';
import path from 'path';

const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));

function simulateFlow(answers: Record<string, any>) {
  const asked: string[] = [];
  const followUps: string[] = [];

  for (const q of questions) {
    let baseConditionMet = true;
    if (q.conditions) {
       for (const cond of q.conditions) {
          const field = cond.field.replace('dynamicAnswers.', '');
          const val = answers[field];
          if (cond.operator === 'equals' && val !== cond.value) baseConditionMet = false;
          if (cond.operator === '<' && val >= cond.value) baseConditionMet = false;
          if (cond.operator === 'exists' && val === undefined) baseConditionMet = false;
       }
    }
    if (baseConditionMet) {
       asked.push(q.title);
       if (q.followUpQuestions) {
         for (const fq of q.followUpQuestions) {
           let conditionMet = true;
           if (fq.conditions) {
             for (const cond of fq.conditions) {
               const field = cond.field.replace('dynamicAnswers.', '');
               const val = answers[field];
               if (cond.operator === 'equals' && val !== cond.value) conditionMet = false;
               if (cond.operator === '<' && val >= cond.value) conditionMet = false;
               if (cond.operator === 'exists' && val === undefined) conditionMet = false;
             }
           }
           if (conditionMet) {
             followUps.push(fq.title);
           }
         }
       }
    }
  }
  return { asked, followUps };
}

console.log("Test 10:", simulateFlow({ planningMarketing: "Yes", projectTimeline: "Confirmed" }));
console.log("Test 14:", simulateFlow({}));
