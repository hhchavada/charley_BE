import { CacheBundle } from './interfaces';

export class ConfigurationCacheValidator {
  /**
   * Scans the constructed bundle for severe structural errors.
   * If the bundle is corrupted, it should not be cached.
   */
  public validate(bundle: CacheBundle): void {
    if (!bundle || !bundle.configuration) {
      throw new Error('Cache Validation Failed: Bundle is empty');
    }

    const { grants } = bundle.configuration;
    
    if (!Array.isArray(grants)) {
      throw new Error('Cache Validation Failed: Grants must be an array');
    }

    const ruleIds = new Set<string>();

    // Deep check for circular references (simplified depth check)
    const traverse = (node: any, depth: number) => {
      if (depth > 50) {
        throw new Error('Cache Validation Failed: Circular or overly deep RuleGroup nesting detected');
      }
      
      if (node.rules) {
        node.rules.forEach((r: any) => {
          if (!r.ruleId) throw new Error('Cache Validation Failed: Rule missing ID');
          if (ruleIds.has(r.ruleId)) {
            // Duplicate rules across different groups are fine as long as they are identical,
            // but in a strict normalized graph, this might be a warning.
          }
          ruleIds.add(r.ruleId);
        });
      }
      
      if (node.nestedGroups) {
        node.nestedGroups.forEach((g: any) => traverse(g, depth + 1));
      }
    };

    grants.forEach(g => traverse(g.ruleGroup, 0));
  }
}
