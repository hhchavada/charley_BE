export class SessionMerger {
  /**
   * Deep merges new answers into the existing payload.
   * Arrays are merged by index or replaced based on object type.
   * Null values in newAnswers can delete existing keys if configured.
   */
  public merge(existingPayload: Record<string, any>, newAnswers: Record<string, any>): Record<string, any> {
    const merged = { ...existingPayload };
    const expandedAnswers: Record<string, any> = {};

    for (const key in newAnswers) {
      if (Object.prototype.hasOwnProperty.call(newAnswers, key)) {
        if (key.includes('.')) {
          const parts = key.split('.');
          let current = expandedAnswers;
          for (let i = 0; i < parts.length - 1; i++) {
            current[parts[i]] = current[parts[i]] || {};
            current = current[parts[i]];
          }
          current[parts[parts.length - 1]] = newAnswers[key];
        } else {
          expandedAnswers[key] = newAnswers[key];
        }
      }
    }

    for (const key in expandedAnswers) {
      if (Object.prototype.hasOwnProperty.call(expandedAnswers, key)) {
        const newValue = expandedAnswers[key];
        const existingValue = merged[key];

        if (this.isPlainObject(newValue) && this.isPlainObject(existingValue)) {
          // Recursive merge for nested objects
          merged[key] = this.merge(existingValue, newValue);
        } else if (Array.isArray(newValue) && Array.isArray(existingValue)) {
          // Multiselect or array fields are completely replaced by the new array
          // to allow users to uncheck/remove items from lists.
          merged[key] = [...newValue];
        } else {
          // Primitives or replacing array with primitive
          merged[key] = newValue;
        }
      }
    }

    return merged;
  }

  private isPlainObject(item: any): boolean {
    return item !== null && typeof item === 'object' && !Array.isArray(item) && item.constructor === Object;
  }
}
