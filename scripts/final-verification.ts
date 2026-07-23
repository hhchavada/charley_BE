import { GrantMatchingEngine } from '../src/engine/GrantMatchingEngine';
import { ResultBuilder } from '../src/engine/ResultBuilder';
import { CompanyData } from '../src/types';
import fs from 'fs';
import path from 'path';

// Load questions.json to simulate question flow
const questionsFilePath = path.join(__dirname, '../src/data/questions.json');
const questions = JSON.parse(fs.readFileSync(questionsFilePath, 'utf-8'));

function getTriggeredQuestions(answers: any): { asked: string[], followUps: string[] } {
  const asked: string[] = [];
  const followUps: string[] = [];

  for (const q of questions) {
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
  return { asked, followUps };
}

const companies = [
  {
    name: "Healthy SME (EDG + MRA)",
    data: {
      id: 'c1', name: 'Healthy SME',
      dynamicAnswers: {
        planningMarketing: "Yes", marketingType: "Strategy",
        planningOverseas: "Yes", targetMarket: "Europe", newMarket: "Yes", overseasSales: 20000,
        mraActivityType: "Promotion", activityCount: 1,
        localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5,
        retainedEarnings: 60000, investorCapital: "yes", projectStarted: "No",
        useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes",
        projectTimeline: "Confirmed"
      }
    }
  },
  {
    name: "Startup (Startup SG)",
    data: {
      id: 'c2', name: 'Startup',
      dynamicAnswers: {
        companyAgeMonths: 3, firstBusiness: "Yes"
      }
    }
  },
  {
    name: "Manufacturing Automation (PSG + WDG)",
    data: {
      id: 'c3', name: 'Manufacturing Automation',
      dynamicAnswers: {
        planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "No",
        planningWdg: "Yes", localEmployees: 5, useConsultant: "Yes", wdgProjectType: "Technology"
      }
    }
  },
  {
    name: "Overseas Expansion (MRA only)",
    data: {
      id: 'c4', name: 'Overseas Expansion',
      dynamicAnswers: {
        planningOverseas: "Yes", targetMarket: "USA", newMarket: "Yes", overseasSales: 10000,
        mraActivityType: "Business Development", activityCount: 1
      }
    }
  },
  {
    name: "Blank / Incomplete",
    data: {
      id: 'c5', name: 'Blank Company',
      dynamicAnswers: {}
    }
  }
];

const engine = new GrantMatchingEngine();

companies.forEach(company => {
  console.log(`\n================================`);
  console.log(`Company: ${company.name}`);
  const { asked, followUps } = getTriggeredQuestions(company.data.dynamicAnswers);
  console.log(`Base Questions Asked: ${asked.length}`);
  console.log(`Follow-up Questions Triggered:`);
  followUps.forEach(f => console.log(`  - ${f}`));

  const matches = engine.match(company.data);
  const finalResponse = ResultBuilder.buildFinalResponse(matches);

  console.log(`\nBuckets:`);
  console.log(`Qualified: ${finalResponse.eligible.map(g => g.grant.id).join(', ')}`);
  console.log(`Potentially Eligible: ${finalResponse.needMoreInfo.map(g => g.grant.id).join(', ')}`);
  console.log(`Not Eligible: ${finalResponse.notEligible.map(g => g.grant.id).join(', ')}`);
  console.log(`Prepare Next: ${finalResponse.prepareNext?.map(g => g.grant.id).join(', ') || ''}`);
  
});
