"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleSheetsService = void 0;
class GoogleSheetsService {
    async fetchGrantsFromSheet() {
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
exports.GoogleSheetsService = GoogleSheetsService;
