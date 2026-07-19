import { CompanyData, Grant, MatchResult, Rule, RuleResult, Operator } from '../types';
import fs from 'fs';
import path from 'path';

export class GrantMatchingEngine {
  private grants: Grant[];

  constructor() {
    const grantsFilePath = path.join(__dirname, '../data/grants.json');
    const data = fs.readFileSync(grantsFilePath, 'utf-8');
    this.grants = JSON.parse(data);
  }

  public match(company: CompanyData): MatchResult[] {
    return this.grants.map(grant => this.evaluateGrant(grant, company));
  }

  private evaluateGrant(grant: Grant, company: CompanyData): MatchResult {
    let qualified = true;
    let missingInfo = false;
    const ruleResults: RuleResult[] = [];

    for (const rule of grant.conditions) {
      const { field, operator, value } = rule;
      const actualValue = this.getFieldValue(company, field);

      if (actualValue === undefined || actualValue === null || actualValue === '') {
        missingInfo = true;
        ruleResults.push({
          rule,
          status: 'Missing',
          message: `${this.formatField(field)} information missing`
        });
        continue;
      }

      const passed = this.evaluateRule(operator, value, actualValue);

      if (passed) {
        ruleResults.push({
          rule,
          status: 'Matched',
          message: `${this.formatField(field)} matched`
        });
      } else {
        qualified = false;
        ruleResults.push({
          rule,
          status: 'Rejected',
          message: `${this.formatField(field)} requirement not met (Expected ${value})`
        });
      }
    }

    let status: MatchResult['status'];
    if (!qualified) {
      status = 'Not Qualified';
    } else if (missingInfo) {
      status = 'Needs More Information';
    } else {
      status = 'Qualified';
    }

    return {
      grant,
      status,
      ruleResults
    };
  }

  private formatField(field: string): string {
    const parts = field.split('.');
    const lastPart = parts[parts.length - 1];
    return lastPart.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }

  private getFieldValue(company: CompanyData, fieldPath: string): any {
    const parts = fieldPath.split('.');
    let current: any = company;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }
    return current;
  }

  private evaluateRule(operator: Operator, expected: any, actual: any): boolean {
    switch (operator) {
      case 'equals':
        return String(actual).toLowerCase() === String(expected).toLowerCase();
      case 'not_equals':
        return String(actual).toLowerCase() !== String(expected).toLowerCase();
      case 'greater_than':
        return Number(actual) > Number(expected);
      case 'less_than':
        return Number(actual) < Number(expected);
      case 'contains':
        if (Array.isArray(actual)) {
          return actual.some(a => String(a).toLowerCase() === String(expected).toLowerCase());
        }
        return String(actual).toLowerCase().includes(String(expected).toLowerCase());
      case 'exists':
        return actual !== undefined && actual !== null && actual !== '';
      default:
        return false;
    }
  }
}
