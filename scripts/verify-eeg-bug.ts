import { GrantMatchingEngine } from '../src/engine/GrantMatchingEngine';
import { ResultBuilder } from '../src/engine/ResultBuilder';

const engine = new GrantMatchingEngine();

const createEEGPayload = (eligibleSector?: string) => {
  const dynamicAnswers: Record<string, string> = { planningEnergyEfficiency: "Yes", alreadyPurchased: "No" };
  if (eligibleSector) {
    dynamicAnswers.eligibleSector = eligibleSector;
  }
  return { id: 'eeg-test', name: 'EEG Test', dynamicAnswers };
};

const runScenario = (id: number, desc: string, sector: string | undefined, expectedLabel: string, check: (res: any) => boolean) => {
  const data = createEEGPayload(sector);
  const matches = engine.match(data);
  const finalResponse = ResultBuilder.buildFinalResponse(matches);
  const isPass = check(finalResponse);
  console.log(`Scenario ${id}: ${desc}`);
  console.log(`- Expected: ${expectedLabel}`);
  console.log(`- PASS / FAIL: ${isPass ? 'PASS' : 'FAIL'}`);
};

runScenario(1, "eligibleSector missing", undefined, "Potentially Eligible", (res) => res.needMoreInfo.some((m: any) => m.grant.id === 'eeg'));
runScenario(2, "eligibleSector = Manufacturing", "Manufacturing", "Continue evaluation (Qualified)", (res) => res.eligible.some((m: any) => m.grant.id === 'eeg'));
runScenario(3, "eligibleSector = Healthcare", "Healthcare", "Not Eligible", (res) => res.notEligible.some((m: any) => m.grant.id === 'eeg'));
