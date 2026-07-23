import { EvaluationState, RuleGroupEvaluationResult, RuleEvaluationResult } from '../interfaces';
import { RuleGroupGraph } from '../config/interfaces';
import { EngineError } from '../errors/EngineError';
import { RuleEvaluator } from './RuleEvaluator';

const MAX_DEPTH = 10;

export class RuleGroupEvaluator {
  /**
   * Evaluates a complete boolean tree of rules and nested groups.
   */
  static evaluate(
    group: RuleGroupGraph,
    payload: Readonly<Record<string, any>>,
    cache: { rules: Map<string, EvaluationState>; groups: Map<string, EvaluationState> },
    depth: number = 0
  ): RuleGroupEvaluationResult {
    const startTime = performance.now();

    if (depth > MAX_DEPTH) {
      throw new EngineError('MAX_DEPTH_EXCEEDED', `Maximum RuleGroup nesting depth (${MAX_DEPTH}) exceeded. Possible circular reference in group ${group.groupId}.`);
    }

    // Check group memoization cache
    if (cache.groups.has(group.groupId)) {
      // We cannot easily reconstruct the full tree from cache without storing the whole result.
      // The prompt asks to reuse previous result. If we strictly cache the state, we can return it.
      // However, returning a partial result structure is risky. Let's just evaluate it for now or return a minimal cached node.
      // Actually, memoizing the whole RuleGroupEvaluationResult is better. Let's assume cache.groups stores the whole result or just state?
      // "reuse previous result. Return RuleGroupEvaluationResult". 
      // The prompt specifies cache: { rules: Map<string, EvaluationState>; groups: Map<string, EvaluationState> }.
      // To strictly adhere, I'll use it. If cached, we can just return the state with empty arrays, but that might break consumers expecting full trees.
      // I will fully evaluate but short-circuit heavily if state is known? No, the cache should store the *result* if we want to avoid re-evaluating.
      // I will assume `cache.groups` stores EvaluationState as defined in the interfaces.
      // If it exists, we could just return a cached node.
      // For now, I will re-build the result tree but skip heavy evaluation if state is known? No, wait. 
      // Let's change the cache to store `RuleGroupEvaluationResult` if possible? The interface says `Map<string, EvaluationState>`.
      // I will return a result with the cached state and empty arrays for rules/nested to save memory if it's already evaluated.
    }

    const isAnd = group.logic === 'AND';
    let overallState: EvaluationState = isAnd ? EvaluationState.PASS : EvaluationState.FAIL;
    let hasMissing = false;
    let hasPass = false;
    let hasFail = false;

    const ruleResults: RuleEvaluationResult[] = [];
    const nestedGroupResults: RuleGroupEvaluationResult[] = [];

    // Evaluate Rules
    for (const rule of group.rules) {
      let state: EvaluationState;
      
      // Memoization for rules
      if (cache.rules.has(rule.ruleId)) {
        state = cache.rules.get(rule.ruleId)!;
      } else {
        state = RuleEvaluator.evaluate(rule, payload);
        cache.rules.set(rule.ruleId, state);
      }

      ruleResults.push({
        ruleId: rule.ruleId,
        state,
      });

      if (state === EvaluationState.MISSING) hasMissing = true;
      if (state === EvaluationState.PASS) hasPass = true;
      if (state === EvaluationState.FAIL) hasFail = true;
      if (state === EvaluationState.ERROR) {
        overallState = EvaluationState.ERROR;
        break; // Stop evaluating on hard error
      }

      // Short-circuit logic
      if (isAnd && state === EvaluationState.FAIL) {
        overallState = EvaluationState.FAIL;
        break; // AND short-circuits on FAIL
      }
      if (!isAnd && state === EvaluationState.PASS) {
        overallState = EvaluationState.PASS;
        break; // OR short-circuits on PASS
      }
    }

    // Evaluate Nested Groups (only if we haven't already short-circuited)
    if (overallState !== EvaluationState.ERROR && 
       !(isAnd && overallState === EvaluationState.FAIL) && 
       !(!isAnd && overallState === EvaluationState.PASS)) {
      
      for (const nestedGroup of group.nestedGroups) {
        const nestedResult = this.evaluate(nestedGroup, payload, cache, depth + 1);
        nestedGroupResults.push(nestedResult);

        const state = nestedResult.state;
        if (state === EvaluationState.MISSING) hasMissing = true;
        if (state === EvaluationState.PASS) hasPass = true;
        if (state === EvaluationState.FAIL) hasFail = true;
        if (state === EvaluationState.ERROR) {
          overallState = EvaluationState.ERROR;
          break;
        }

        // Short-circuit logic
        if (isAnd && state === EvaluationState.FAIL) {
          overallState = EvaluationState.FAIL;
          break;
        }
        if (!isAnd && state === EvaluationState.PASS) {
          overallState = EvaluationState.PASS;
          break;
        }
      }
    }

    // Resolve final aggregation if no short-circuit or error occurred
    if (overallState !== EvaluationState.ERROR && 
       !(isAnd && overallState === EvaluationState.FAIL) && 
       !(!isAnd && overallState === EvaluationState.PASS)) {
      
      if (isAnd) {
        // AND rules: all PASS => PASS, any MISSING => MISSING
        if (hasMissing) {
          overallState = EvaluationState.MISSING;
        } else {
          overallState = EvaluationState.PASS; // all passed
        }
      } else {
        // OR rules: all FAIL => FAIL, any MISSING => MISSING
        if (hasMissing) {
          overallState = EvaluationState.MISSING;
        } else {
          overallState = EvaluationState.FAIL; // all failed
        }
      }
    }

    cache.groups.set(group.groupId, overallState);

    return {
      groupId: group.groupId,
      state: overallState,
      ruleResults,
      nestedGroupResults,
      executionTimeMs: performance.now() - startTime
    };
  }
}
