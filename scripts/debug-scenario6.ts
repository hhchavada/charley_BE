import { GrantMatchingEngine } from '../src/engine/GrantMatchingEngine';
import { ResultBuilder } from '../src/engine/ResultBuilder';

const engine = new GrantMatchingEngine();
const data = { id: 's6', name: 'S6', dynamicAnswers: { planningMarketing: "Yes", marketingType: "Tactical", localShareholding: 40, financiallyViable: "Yes", currentRatio: 1.5, retainedEarnings: 60000, projectStarted: "No", useSacConsultant: "Yes", vendorRelatedParty: "No", isSme: "Yes", canAffordProject: "Yes", projectTimeline: "Confirmed", usePreApprovedSolution: "Yes", alreadyPurchased: "No" } };

const matches = engine.match(data);
const finalResponse = ResultBuilder.buildFinalResponse(matches);

console.log("Eligible:", finalResponse.eligible.map(m => m.grant.id));
console.log("Need More Info:", finalResponse.needMoreInfo.map(m => m.grant.id));
console.log("Not Eligible:", finalResponse.notEligible.map(m => m.grant.id));
