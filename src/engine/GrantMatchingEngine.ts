import { CompanyData, Grant, MatchResult, RuleResult } from '../types';
import { RuleEngine } from './RuleEngine';
import { ResultBuilder } from './ResultBuilder';
import fs from 'fs';
import path from 'path';

export class GrantMatchingEngine {
  private grants: Grant[];

  constructor() {
    const paths = [
      path.join(__dirname, '../data/grants.json'),
      path.join(__dirname, '../../src/data/grants.json'),
      path.join(process.cwd(), 'src/data/grants.json')
    ];
    let grantsFilePath = paths[0];
    for (const p of paths) {
      if (fs.existsSync(p)) {
        grantsFilePath = p;
        break;
      }
    }
    const data = fs.readFileSync(grantsFilePath, 'utf-8');
    this.grants = JSON.parse(data);
  }

  public match(company: CompanyData): MatchResult[] {
    // Memoize field lookups for this matching cycle to optimize performance for 200+ grants
    const fieldCache = new Map<string, any>();
    
    return this.grants.map(grant => this.evaluateGrant(grant, company, fieldCache));
  }

  private evaluateGrant(grant: Grant, company: CompanyData, fieldCache: Map<string, any>): MatchResult {
    const matchedRules: RuleResult[] = [];
    const failedRules: RuleResult[] = [];
    const missingRules: RuleResult[] = [];

    for (const rule of grant.conditions) {
      const { field, operator, value } = rule;
      
      let actualValue;
      if (fieldCache.has(field)) {
        actualValue = fieldCache.get(field);
      } else {
        actualValue = RuleEngine.getFieldValue(company, field);
        fieldCache.set(field, actualValue);
      }

      const result: RuleResult = {
        ruleId: rule.id || `rule_${field}_${operator}`,
        ruleName: rule.name || `Rule for ${field}`,
        field,
        operator,
        expectedValue: value,
        actualValue,
        status: 'FAIL' // Default, overridden below
      };



      if (actualValue === undefined || actualValue === null || actualValue === '') {
        result.status = 'MISSING_DATA';
        missingRules.push(result);
        continue;
      }

      const passed = RuleEngine.evaluate(operator, value, actualValue);
      result.status = passed ? 'PASS' : 'FAIL';
      
      if (passed) {
        matchedRules.push(result);
      } else {
        failedRules.push(result);
      }
    }

    return ResultBuilder.build(grant, matchedRules, failedRules, missingRules);
  }
}

