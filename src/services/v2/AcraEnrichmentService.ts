import fs from 'fs';
import path from 'path';

export class AcraEnrichmentService {
  private cache: Map<string, any> = new Map();
  private isLoaded = false;

  private loadData() {
    if (this.isLoaded) return;
    
    try {
      const dataPath = path.join(__dirname, '../../../data/acra/corporate-entities.json');
      if (fs.existsSync(dataPath)) {
        const rawData = fs.readFileSync(dataPath, 'utf8');
        const json = JSON.parse(rawData);
        
        for (const record of json) {
          if (record.uen) {
            this.cache.set(record.uen, record);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load ACRA data:', error);
    }
    
    this.isLoaded = true;
  }

  public enrich(initialData: Record<string, any>): Record<string, any> {
    if (!initialData || !initialData.uen) {
      return initialData;
    }
    
    this.loadData();
    
    const acraRecord = this.cache.get(initialData.uen);
    if (!acraRecord) {
      return initialData;
    }

    // Merge: frontend data takes precedence over ACRA data
    return {
      ...acraRecord,
      ...initialData
    };
  }
}
