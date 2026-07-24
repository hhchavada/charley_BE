"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RankingEngine = void 0;
const execution_1 = require("../interfaces/execution");
class RankingEngine {
    async rank(grants) {
        const diagnostics = {
            duplicatePriority: [],
            missingConfiguration: [],
            invalidStream: [],
            brokenMergeRule: [],
            windowConflict: []
        };
        const readyNow = [];
        const needsInformation = [];
        const prepareNext = [];
        const windowClosed = [];
        const hidden = [];
        let totalEstimatedFunding = 0;
        let totalMaximumFunding = 0;
        let mergedCardsCount = 0;
        // 1. Convert to RankedGrantDTO and extract metadata
        const rawRanked = grants.map(g => {
            const meta = g.grant.metadata || {};
            return {
                grantResult: g,
                recommendationScore: this.calculateScore(g),
                badges: meta.badges || [],
                isMergedCard: false,
                windowStatus: meta.windowStatus || 'OPEN',
                stacksWithOtherGrants: meta.stacksWithOtherGrants || false,
                whyRanked: 'Based on configuration priority.',
                AIExplanation: g.explanation?.reasonSummary || undefined
            };
        });
        // 2. Group by mergeGroup
        const mergeGroups = new Map();
        const standaloneGrants = [];
        for (const r of rawRanked) {
            const mergeGroup = r.grantResult.grant.mergeGroup || r.grantResult.grant.metadata?.mergeGroup;
            if (mergeGroup) {
                if (!mergeGroups.has(mergeGroup))
                    mergeGroups.set(mergeGroup, []);
                mergeGroups.get(mergeGroup).push(r);
            }
            else {
                standaloneGrants.push(r);
            }
        }
        const processedGrants = [...standaloneGrants];
        // 3. Process Merging (e.g., EDG streams)
        for (const [groupName, streams] of mergeGroups.entries()) {
            if (streams.length === 1) {
                processedGrants.push(streams[0]);
                continue;
            }
            // Sort streams by streamPriority descending
            streams.sort((a, b) => {
                const pA = a.grantResult.grant.streamPriority ?? a.grantResult.grant.metadata?.streamPriority ?? 0;
                const pB = b.grantResult.grant.streamPriority ?? b.grantResult.grant.metadata?.streamPriority ?? 0;
                return pB - pA;
            });
            const recommendedStream = streams[0].grantResult;
            const mergedCard = {
                // Use the recommended stream as the primary face of the card
                grantResult: recommendedStream,
                recommendationScore: streams[0].recommendationScore, // Take highest score
                badges: streams[0].badges,
                isMergedCard: true,
                mergedStreams: streams.map(s => s.grantResult),
                recommendedStream,
                windowStatus: streams[0].windowStatus,
                stacksWithOtherGrants: streams[0].stacksWithOtherGrants,
                whyRecommended: `Stream '${recommendedStream.grant.name}' is highly recommended based on your profile.`
            };
            processedGrants.push(mergedCard);
            mergedCardsCount++;
        }
        // 4. Sort globally by recommendationScore and global priority
        processedGrants.sort((a, b) => {
            const priorityA = a.grantResult.grant.priority || a.grantResult.grant.metadata?.priority || 99;
            const priorityB = b.grantResult.grant.priority || b.grantResult.grant.metadata?.priority || 99;
            if (priorityB !== priorityA)
                return priorityA - priorityB; // Ascending: 1 is highest priority
            return b.recommendationScore - a.recommendationScore;
        });
        // 5. Bucket into Ready States
        for (const item of processedGrants) {
            const meta = item.grantResult.grant.metadata || {};
            const state = item.grantResult.state;
            // Ensure MISSING is always POTENTIALLY_ELIGIBLE
            if (state === execution_1.GrantState.NOT_ELIGIBLE) {
                item.whyHidden = 'Does not meet eligibility criteria.';
                hidden.push(item);
                continue;
            }
            if (item.windowStatus === 'CLOSED' || item.windowStatus === 'EXPIRED') {
                windowClosed.push(item);
                continue;
            }
            // Accumulate funding (EIS rule: stacksWithOtherGrants do not add to total)
            if (!item.stacksWithOtherGrants) {
                const estStr = item.grantResult.grant.estimatedFunding;
                if (estStr) {
                    const num = parseInt(estStr.replace(/[^0-9]/g, ''));
                    if (!isNaN(num))
                        totalEstimatedFunding += num;
                }
                const capStr = item.grantResult.grant.officialCap;
                if (capStr) {
                    const num = parseInt(capStr.replace(/[^0-9]/g, ''));
                    if (!isNaN(num))
                        totalMaximumFunding += num;
                }
            }
            if (meta.isPrepareNext) {
                prepareNext.push(item);
                continue;
            }
            if (state === execution_1.GrantState.POTENTIALLY_ELIGIBLE) {
                needsInformation.push(item);
                continue;
            }
            readyNow.push(item);
        }
        // 6. Generate Funding Summary Placeholder (Config Driven)
        const fundingSummary = {
            estimatedFunding: totalEstimatedFunding,
            maximumFunding: totalMaximumFunding > 0 ? totalMaximumFunding : totalEstimatedFunding * 1.2,
            fundingRange: `$0 - $${totalEstimatedFunding.toLocaleString()}`,
            supportPercentage: 'Up to 70%',
            fundingType: 'Cash / Reimbursement',
            grantCategory: 'Business Growth',
            processingTime: '4 - 8 weeks'
        };
        const statistics = {
            totalRanked: processedGrants.length,
            mergedCardsCount,
            totalEstimatedFunding
        };
        return {
            readyNow,
            needsInformation,
            prepareNext,
            windowClosed,
            hidden,
            statistics,
            fundingSummary,
            diagnostics
        };
    }
    /**
     * Generates a dynamic recommendation score based on configurable inputs.
     */
    calculateScore(g) {
        const meta = g.grant.metadata || {};
        let score = 0;
        score += (g.grant.priority || 0) * 10;
        score += g.completionPercentage * 0.5;
        score += g.ruleCoverage * 0.5;
        score += (meta.aiConfidence || 0) * 2;
        return score;
    }
}
exports.RankingEngine = RankingEngine;
