"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultBuilder = void 0;
class ResultBuilder {
    static buildFinalResponse(results) {
        // 1. Deduplicate by mergeGroup
        const mergedResults = [];
        const grouped = new Map();
        for (const r of results) {
            if (!r.grant.mergeGroup || r.grant.stacksWithEverything) {
                mergedResults.push(r);
            }
            else {
                if (!grouped.has(r.grant.mergeGroup)) {
                    grouped.set(r.grant.mergeGroup, []);
                }
                grouped.get(r.grant.mergeGroup).push(r);
            }
        }
        // Merge logic: Pick highest status, then highest streamPriority
        for (const [_, groupResults] of grouped) {
            groupResults.sort((a, b) => {
                const statusWeight = (status) => status === 'Qualified' ? 3 : status.toString().startsWith('Potentially eligible') ? 2 : 1;
                const weightA = statusWeight(a.qualificationStatus);
                const weightB = statusWeight(b.qualificationStatus);
                if (weightA !== weightB)
                    return weightB - weightA; // Higher weight first
                const streamA = a.grant.streamPriority ?? 999;
                const streamB = b.grant.streamPriority ?? 999;
                return streamA - streamB; // Lower number is higher priority
            });
            mergedResults.push(groupResults[0]);
        }
        // 2. Group into buckets
        const isPrepareNext = (r) => r.grant.prepareNext === true;
        const prepareNext = mergedResults.filter(r => isPrepareNext(r));
        const regularResults = mergedResults.filter(r => !isPrepareNext(r));
        const eligible = regularResults.filter(r => r.qualificationStatus === 'Qualified');
        const needMoreInfo = regularResults.filter(r => r.qualificationStatus.toString().startsWith('Potentially eligible'));
        const notEligible = regularResults.filter(r => r.qualificationStatus === 'Not Qualified');
        // Sort by priority (ascending, where 1 is highest priority)
        const sortByPriority = (a, b) => (a.grant.priority ?? 999) - (b.grant.priority ?? 999);
        return {
            eligible: eligible.sort(sortByPriority),
            needMoreInfo: needMoreInfo.sort(sortByPriority),
            notEligible: notEligible.sort(sortByPriority),
            prepareNext: prepareNext.sort(sortByPriority)
        };
    }
    static build(grant, matchedRules, failedRules, missingRules) {
        const qualified = failedRules.length === 0;
        const missingInfo = missingRules.length > 0;
        let qualificationStatus;
        if (!qualified) {
            qualificationStatus = 'Not Qualified';
        }
        else if (missingInfo) {
            qualificationStatus = `Potentially eligible — confirm ${missingRules.map(r => r.field).join(', ')}`;
        }
        else {
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
exports.ResultBuilder = ResultBuilder;
