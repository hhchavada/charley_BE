import { Grant, Rule } from '../types';

export class GoogleSheetsService {
  public async fetchGrantsFromSheet(): Promise<Grant[]> {
    return [
      {
        id: 'g_edg',
        name: 'Enterprise Development Grant (EDG)',
        estimatedFunding: 'Up to 50%',
        priority: 1,
        conditions: [
          {
            field: 'industry',
            operator: '==',
            value: 'Technology'
          }
        ]
      }
    ];
  }
}
