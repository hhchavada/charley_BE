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
    name: "Scenario 1: The Ultimate SME (EDG, MRA, PSG, CCP, WDG, EIS, CTC)",
    data: {
      id: 'hp1', name: 'Ultimate SME Pte Ltd',
      dynamicAnswers: {
        localShareholding: 50, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 100000,
        investorCapital: "yes", projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No",
        isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed",
        planningMarketing: "Yes", marketingType: "Strategy",
        planningOverseas: "Yes", targetMarket: "USA", newMarket: "Yes", overseasSales: 50000, mraActivityType: "Market Setup", activityCount: 1,
        planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "No",
        planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 35, unemployedMonths: 2, isShareholder: "No", isExEmployee: "No",
        planningWdg: "Yes", localEmployees: 10, useConsultant: "Yes", wdgProjectType: "Capability",
        planningInnovation: "Yes", planningTraining: "Yes"
      }
    }
  },
  {
    name: "Scenario 2: First-Time Tech Startup (Startup SG, PSG, EIS, ADS)",
    data: {
      id: 'hp2', name: 'TechStart Pte Ltd',
      dynamicAnswers: {
        companyAgeMonths: 6, firstBusiness: "Yes",
        planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "No",
        planningInnovation: "Yes", planningAdvancedDigital: "Yes"
      }
    }
  },
  {
    name: "Scenario 3: Retail Expansion (MRA, EDG Marketing, PSG)",
    data: {
      id: 'hp3', name: 'Retail King',
      dynamicAnswers: {
        planningOverseas: "Yes", targetMarket: "Japan", newMarket: "Yes", overseasSales: 0, mraActivityType: "Promotion", activityCount: 1,
        planningMarketing: "Yes", marketingType: "Strategy",
        localShareholding: 100, financiallyViable: "Yes", currentRatio: 2.0, retainedEarnings: 500000,
        investorCapital: "yes", projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed",
        planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "No"
      }
    }
  },
  {
    name: "Scenario 4: Heavy Manufacturing (EDG Automation, EEG, ADS)",
    data: {
      id: 'hp4', name: 'Heavy Duty Mfg',
      dynamicAnswers: {
        planningAutomation: "Yes", automationType: "Hardware", automationSizing: "1M+",
        localShareholding: 60, financiallyViable: "Yes", currentRatio: 1.2, retainedEarnings: 200000,
        investorCapital: "yes", projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed",
        planningEnergyEfficiency: "Yes", planningAdvancedDigital: "Yes"
      }
    }
  },
  {
    name: "Scenario 5: HR Overhaul (CCP Standard, WDG Consultancy, CTC)",
    data: {
      id: 'hp5', name: 'HR Solutions Inc',
      dynamicAnswers: {
        planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 30, unemployedMonths: 2, isShareholder: "No", isExEmployee: "No",
        planningWdg: "Yes", localEmployees: 25, useConsultant: "Yes", wdgProjectType: "Consultancy",
        planningTraining: "Yes"
      }
    }
  },
  {
    name: "Scenario 6: Local Service Business (PSG, WDG Capability)",
    data: {
      id: 'hp6', name: 'Local Services Co',
      dynamicAnswers: {
        planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "No",
        planningWdg: "Yes", localEmployees: 5, useConsultant: "Yes", wdgProjectType: "Capability"
      }
    }
  },
  {
    name: "Scenario 7: Overseas Tech Exporter (MRA, EDG Strategy)",
    data: {
      id: 'hp7', name: 'ExportTech',
      dynamicAnswers: {
        planningOverseas: "Yes", targetMarket: "UK", newMarket: "Yes", overseasSales: 10000, mraActivityType: "Business Development", activityCount: 1,
        localShareholding: 75, financiallyViable: "Yes", currentRatio: 3.0, retainedEarnings: 80000,
        investorCapital: "yes", projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed",
        projectType: "Business Strategy"
      }
    }
  },
  {
    name: "Scenario 8: Green Tech Startup (Startup SG, EEG, EIS)",
    data: {
      id: 'hp8', name: 'GreenEco',
      dynamicAnswers: {
        companyAgeMonths: 10, firstBusiness: "Yes",
        planningEnergyEfficiency: "Yes", planningInnovation: "Yes"
      }
    }
  },
  {
    name: "Scenario 9: Mature HR Expansion (CCP LTU 90% Support)",
    data: {
      id: 'hp9', name: 'Silver Workforce',
      dynamicAnswers: {
        planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 45, unemployedMonths: 8, isShareholder: "No", isExEmployee: "No"
      }
    }
  },
  {
    name: "Scenario 10: Fully Comprehensive Innovator (EIS, CTC, ADS, EDG Marketing)",
    data: {
      id: 'hp10', name: 'InnovaCorp',
      dynamicAnswers: {
        planningInnovation: "Yes", planningTraining: "Yes", planningAdvancedDigital: "Yes",
        planningMarketing: "Yes", marketingType: "Strategy",
        localShareholding: 100, financiallyViable: "Yes", currentRatio: 2.5, retainedEarnings: 300000,
        investorCapital: "yes", projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed"
      }
    }
  }
];

const engine = new GrantMatchingEngine();

let reportContent = `# Phase 1: Happy Path Testing Report\n\n`;

companies.forEach(company => {
  const { asked, followUps } = getTriggeredQuestions(company.data.dynamicAnswers);
  const matches = engine.match(company.data);
  const finalResponse = ResultBuilder.buildFinalResponse(matches);

  const getFundingString = (g: any) => g.typicalFunding || g.estimatedFunding;

  reportContent += `## ${company.name}\n`;
  reportContent += `**Questions Asked:** ${asked.length}\n`;
  reportContent += `**Follow-up Questions:** ${followUps.length}\n`;
  if (followUps.length > 0) reportContent += `  - ${followUps.join('\n  - ')}\n`;
  
  reportContent += `**Qualified Grants:** ${finalResponse.eligible.length > 0 ? finalResponse.eligible.map(m => m.grant.name).join(', ') : 'None'}\n`;
  reportContent += `**Potentially Eligible Grants:** ${finalResponse.needMoreInfo.length > 0 ? finalResponse.needMoreInfo.map(m => m.grant.name).join(', ') : 'None'}\n`;
  reportContent += `**Not Eligible Grants:** ${finalResponse.notEligible.length > 0 ? finalResponse.notEligible.map(m => m.grant.name).join(', ') : 'None'}\n`;
  reportContent += `**Prepare Next:** ${finalResponse.prepareNext && finalResponse.prepareNext.length > 0 ? finalResponse.prepareNext.map(m => m.grant.name).join(', ') : 'None'}\n`;
  
  const totalFunding = finalResponse.eligible
    .filter(m => !m.grant.excludeFromTotalFunding)
    .map(m => {
      const f = getFundingString(m.grant);
      const match = f.match(/\$?([\d,]+)/);
      return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
    })
    .reduce((a, b) => a + b, 0);

  reportContent += `**Estimated Funding:** $${totalFunding.toLocaleString()}\n`;
  
  const ranking = finalResponse.eligible.map(m => `${m.grant.priority}. ${m.grant.name}`).join(' | ');
  reportContent += `**Ranking:** ${ranking || 'None'}\n`;
  reportContent += `**Warnings:** None (Happy Path)\n\n`;
  reportContent += `---\n\n`;
});

fs.writeFileSync(path.join(__dirname, '../docs/PHASE_1_HAPPY_PATH_REPORT.md'), reportContent);
console.log(`Generated PHASE_1_HAPPY_PATH_REPORT.md`);
