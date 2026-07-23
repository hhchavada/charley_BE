import { Grant, MatchResult, RuleResult } from '../types';

export interface FinalMatchResponse {
  eligible: MatchResult[];
  needMoreInfo: MatchResult[];
  notEligible: MatchResult[];
  prepareNext: MatchResult[];
}

export class ResultBuilder {
  public static buildFinalResponse(results: MatchResult[]): FinalMatchResponse & { prepareNext: MatchResult[] } {
    // 1. Deduplicate by mergeGroup
    const mergedResults: MatchResult[] = [];
    const grouped = new Map<string, MatchResult[]>();

    for (const r of results) {
      if (!r.grant.mergeGroup || r.grant.stacksWithEverything) {
        mergedResults.push(r);
      } else {
        if (!grouped.has(r.grant.mergeGroup)) {
          grouped.set(r.grant.mergeGroup, []);
        }
        grouped.get(r.grant.mergeGroup)!.push(r);
      }
    }

    // Merge logic: Pick highest status, then highest streamPriority
    for (const [_, groupResults] of grouped) {
      groupResults.sort((a, b) => {
        const statusWeight = (status: string) => status === 'Qualified' ? 3 : status.toString().startsWith('Potentially eligible') ? 2 : 1;
        const weightA = statusWeight(a.qualificationStatus);
        const weightB = statusWeight(b.qualificationStatus);
        if (weightA !== weightB) return weightB - weightA; // Higher weight first
        
        const streamA = a.grant.streamPriority ?? 999;
        const streamB = b.grant.streamPriority ?? 999;
        return streamA - streamB; // Lower number is higher priority
      });
      mergedResults.push(groupResults[0]);
    }

    // 2. Group into buckets
    const isPrepareNext = (r: MatchResult) => r.grant.prepareNext === true;
    
    const prepareNext = mergedResults.filter(r => isPrepareNext(r));
    const regularResults = mergedResults.filter(r => !isPrepareNext(r));

    const eligible = regularResults.filter(r => r.qualificationStatus === 'Qualified');
    const needMoreInfo = regularResults.filter(r => r.qualificationStatus.toString().startsWith('Potentially eligible'));
    const notEligible = regularResults.filter(r => r.qualificationStatus === 'Not Qualified');

    // Sort by priority (ascending, where 1 is highest priority)
    const sortByPriority = (a: MatchResult, b: MatchResult) => (a.grant.priority ?? 999) - (b.grant.priority ?? 999);

    return {
      eligible: eligible.sort(sortByPriority),
      needMoreInfo: needMoreInfo.sort(sortByPriority),
      notEligible: notEligible.sort(sortByPriority),
      prepareNext: prepareNext.sort(sortByPriority)
    };
  }

  public static build(grant: Grant, matchedRules: RuleResult[], failedRules: RuleResult[], missingRules: RuleResult[]): MatchResult {
    const qualified = failedRules.length === 0;
    const missingInfo = missingRules.length > 0;

    let qualificationStatus: MatchResult['qualificationStatus'];
    if (!qualified) {
      qualificationStatus = 'Not Qualified';
    } else if (missingInfo) {
      qualificationStatus = `Potentially eligible — confirm ${missingRules.map(r => r.field).join(', ')}` as any;
    } else {
      qualificationStatus = 'Qualified';
    }

    const totalRules = matchedRules.length + failedRules.length + missingRules.length;
    const evaluationScore = totalRules === 0 ? 0 : Math.round((matchedRules.length / totalRules) * 100);

    return {
      grant,
      matchedRules,
      failedRules,
      missingRules,
      qualificationStatus,
      priority: grant.priority,
      estimatedFunding: grant.estimatedFunding,
      evaluationScore,
      evaluationSummary: `Matched ${matchedRules.length} rules, failed ${failedRules.length} rules, missing ${missingRules.length} inputs.`
    };
  }
}
