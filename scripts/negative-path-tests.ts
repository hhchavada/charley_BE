import { GrantMatchingEngine } from '../src/engine/GrantMatchingEngine';
import { ResultBuilder } from '../src/engine/ResultBuilder';
import { CompanyData } from '../src/types';
import fs from 'fs';
import path from 'path';

const scenarios = [
  // EDG Scenarios
  {
    id: 1, name: "EDG - Local Shareholding = 20%",
    data: { id: 's1', name: 'S1', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Strategy", localShareholding: 20, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 60000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EDG"
  },
  {
    id: 2, name: "EDG - Current Ratio < 1",
    data: { id: 's2', name: 'S2', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Strategy", localShareholding: 40, financiallyViable: "Yes", currentRatio: 0.8, retainedEarnings: 60000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EDG"
  },
  {
    id: 3, name: "EDG - Retained Earnings = 10000",
    data: { id: 's3', name: 'S3', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Strategy", localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 10000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EDG"
  },
  {
    id: 4, name: "EDG - Project Already Started = YES",
    data: { id: 's4', name: 'S4', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Strategy", localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 60000, projectStarted: "Yes", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EDG"
  },
  {
    id: 5, name: "EDG - Related Party Vendor = YES",
    data: { id: 's5', name: 'S5', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Strategy", localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 60000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "Yes", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EDG"
  },
  {
    id: 6, name: "EDG - Marketing Type = Tactical",
    data: { id: 's6', name: 'S6', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Tactical", localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 60000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed", usePreApprovedSolution: "Yes", alreadyPurchased: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('edg-')) && res.eligible.find((m: any) => m.grant.id === 'psg-marketing-tactical'),
    expectedLabel: "No EDG, Recommend PSG", grantTarget: "EDG & PSG"
  },
  // MRA Scenarios
  {
    id: 7, name: "MRA - Existing Market",
    data: { id: 's7', name: 'S7', dynamicAnswers: { planningOverseas: "Yes", targetMarket: "Japan", newMarket: "No", overseasSales: 50000, mraActivityType: "Promotion", activityCount: 1 } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('mra-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "MRA"
  },
  {
    id: 8, name: "MRA - Overseas Sales = 250000",
    data: { id: 's8', name: 'S8', dynamicAnswers: { planningOverseas: "Yes", targetMarket: "Japan", newMarket: "Yes", overseasSales: 250000, mraActivityType: "Promotion", activityCount: 1 } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('mra-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "MRA"
  },
  {
    id: 9, name: "MRA - Multiple Activities Selected",
    data: { id: 's9', name: 'S9', dynamicAnswers: { planningOverseas: "Yes", targetMarket: "Japan", newMarket: "Yes", overseasSales: 50000, mraActivityType: "Promotion", activityCount: 2 } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('mra-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "MRA"
  },
  // PSG Scenarios
  {
    id: 10, name: "PSG - Already Purchased = YES",
    data: { id: 's10', name: 'S10', dynamicAnswers: { planningIT: "Yes", usePreApprovedSolution: "Yes", alreadyPurchased: "Yes" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('psg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "PSG"
  },
  {
    id: 11, name: "PSG - Solution Not Pre-approved",
    data: { id: 's11', name: 'S11', dynamicAnswers: { planningIT: "Yes", usePreApprovedSolution: "No", alreadyPurchased: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('psg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "PSG"
  },
  // CCP Scenarios
  {
    id: 12, name: "CCP - Candidate NOT Citizen / PR",
    data: { id: 's12', name: 'S12', dynamicAnswers: { planningHiring: "Yes", isCitizenOrPR: "No", candidateAge: 30, unemployedMonths: 2, isShareholder: "No", isExEmployee: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('ccp-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "CCP"
  },
  {
    id: 13, name: "CCP - Candidate Age <21",
    data: { id: 's13', name: 'S13', dynamicAnswers: { planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 20, unemployedMonths: 2, isShareholder: "No", isExEmployee: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('ccp-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "CCP"
  },
  {
    id: 14, name: "CCP - Candidate is Shareholder",
    data: { id: 's14', name: 'S14', dynamicAnswers: { planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 30, unemployedMonths: 2, isShareholder: "Yes", isExEmployee: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('ccp-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "CCP"
  },
  {
    id: 15, name: "CCP - Candidate is Ex Employee",
    data: { id: 's15', name: 'S15', dynamicAnswers: { planningHiring: "Yes", isCitizenOrPR: "Yes", candidateAge: 30, unemployedMonths: 2, isShareholder: "No", isExEmployee: "Yes" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('ccp-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "CCP"
  },
  // WDG Scenarios
  {
    id: 16, name: "WDG - Local Employees = 2",
    data: { id: 's16', name: 'S16', dynamicAnswers: { planningWdg: "Yes", localEmployees: 2, useConsultant: "Yes", wdgProjectType: "Consultancy" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('wdg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "WDG"
  },
  {
    id: 17, name: "WDG - Consultant = NO",
    data: { id: 's17', name: 'S17', dynamicAnswers: { planningWdg: "Yes", localEmployees: 5, useConsultant: "No", wdgProjectType: "Consultancy" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('wdg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "WDG"
  },
  // Startup SG Scenarios
  {
    id: 18, name: "Startup SG - Company Older Than 12 Months",
    data: { id: 's18', name: 'S18', dynamicAnswers: { companyAgeMonths: 15, firstBusiness: "Yes" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('startup-sg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "Startup SG"
  },
  {
    id: 19, name: "Startup SG - First Business = NO",
    data: { id: 's19', name: 'S19', dynamicAnswers: { companyAgeMonths: 6, firstBusiness: "No" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('startup-sg-')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "Startup SG"
  },
  // EEG Scenarios
  {
    id: 20, name: "EEG - Already Purchased Equipment",
    data: { id: 's20', name: 'S20', dynamicAnswers: { planningEnergyEfficiency: "Yes", alreadyPurchased: "Yes" } },
    check: (res: any) => !res.eligible.find((m: any) => m.grant.id.startsWith('eeg')),
    expectedLabel: "NOT ELIGIBLE", grantTarget: "EEG"
  }
];

const engine = new GrantMatchingEngine();

let reportContent = `# Phase 2: Negative Business Testing Report\n\n`;
let passedCount = 0;
let failedCount = 0;
let businessBugs: string[] = [];

scenarios.forEach(scenario => {
  const matches = engine.match(scenario.data);
  const finalResponse = ResultBuilder.buildFinalResponse(matches);

  const isPass = scenario.check(finalResponse);
  const actualLabel = isPass ? scenario.expectedLabel : "INCORRECT QUALIFICATION (Grant mistakenly marked as eligible or potentially eligible)";

  if (isPass) {
    passedCount++;
  } else {
    failedCount++;
    businessBugs.push(`Scenario ${scenario.id}: ${scenario.name} failed to reject properly. Expected ${scenario.expectedLabel}, but ${scenario.grantTarget} was found in eligible/potentially eligible.`);
  }

  reportContent += `### Scenario ${scenario.id}. ${scenario.name}\n`;
  reportContent += `- **Expected:** ${scenario.expectedLabel}\n`;
  reportContent += `- **Actual:** ${actualLabel}\n`;
  reportContent += `- **Result:** ${isPass ? 'PASS' : 'FAIL'}\n`;
  if (!isPass) {
    reportContent += `- **Reason:** Engine did not strictly reject ${scenario.grantTarget} according to business rules. Incorrect qualification occurred.\n`;
  }
  reportContent += `\n---\n\n`;
});

reportContent += `## Summary\n\n`;
reportContent += `- **Total Tests:** ${scenarios.length}\n`;
reportContent += `- **Passed:** ${passedCount}\n`;
reportContent += `- **Failed:** ${failedCount}\n`;
reportContent += `- **Business Bugs:** ${failedCount}\n\n`;

if (failedCount > 0) {
  reportContent += `### Incorrect Qualifications Found:\n`;
  businessBugs.forEach(bug => {
    reportContent += `- ${bug}\n`;
  });
}

reportContent += `\n**Overall Result:** ${failedCount === 0 ? 'PASS' : 'FAIL'}\n`;

fs.writeFileSync(path.join(__dirname, '../docs/PHASE_2_NEGATIVE_REPORT.md'), reportContent);
console.log(`Generated PHASE_2_NEGATIVE_REPORT.md`);
