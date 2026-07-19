import { parse } from 'csv-parse/sync';
import { Grant, Rule } from '../types';

export class GoogleSheetsService {
  private static SHEET_URL = 'https://docs.google.com/spreadsheets/d/1jYrAvsaUGdHwYGy1q8u53fD6wcJodOlmtLjAKqnFLPA/export?format=csv&gid=1947513490';

  public static async fetchGrants(): Promise<Grant[]> {
    try {
      const response = await fetch(this.SHEET_URL);
      const csvText = await response.text();
      
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true
      });

      const grants: Grant[] = records.map((record: any, index: number) => {
        const title = record['title'] || `Grant ${index + 1}`;
        const funding = record['highlights/Max Support Amount'] || 'Variable';
        const support = record['highlights/Support Percentage'] || 'Variable';
        
        const rules: Rule[] = [];
        
        let requiresSingapore = false;
        let requiresLocalShareholding = false;
        
        for (const [key, val] of Object.entries(record)) {
          if (!val) continue;
          const lowerKey = key.toLowerCase();
          const lowerVal = String(val).toLowerCase();
          
          if (lowerKey.includes('eligibility criteria')) {
            if (lowerKey.includes('registered') || lowerVal.includes('registered and operating') || lowerVal.includes('incorporated in singapore')) {
              requiresSingapore = true;
            }
            if (lowerKey.includes('shareholding') || lowerVal.includes('30% local')) {
              requiresLocalShareholding = true;
            }
          }
        }

        if (requiresSingapore) {
          rules.push({ field: "registeredInSg", operator: "eq", value: true });
        }
        if (requiresLocalShareholding) {
          rules.push({ field: "localShareholding", operator: "gte", value: 30 });
        }

        // Fallback rule if nothing was extracted
        if (rules.length === 0) {
           rules.push({ field: "country", operator: "eq", value: "Singapore" });
        }

        return {
          id: `sheet_grant_${index}`,
          title,
          funding,
          support,
          priority: "Medium",
          rules
        };
      });

      // Filter out completely empty rows
      return grants.filter((g, index) => g.title && g.title !== `Grant ${index + 1}`);
    } catch (error) {
      console.error('Error fetching grants from Google Sheets:', error);
      return [];
    }
  }
}
