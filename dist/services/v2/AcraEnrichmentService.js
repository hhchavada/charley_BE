"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AcraEnrichmentService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class AcraEnrichmentService {
    cache = new Map();
    isLoaded = false;
    loadData() {
        if (this.isLoaded)
            return;
        try {
            const dataPath = path_1.default.join(__dirname, '../../../data/acra/corporate-entities.json');
            if (fs_1.default.existsSync(dataPath)) {
                const rawData = fs_1.default.readFileSync(dataPath, 'utf8');
                const json = JSON.parse(rawData);
                for (const record of json) {
                    if (record.uen) {
                        this.cache.set(record.uen, record);
                    }
                }
            }
        }
        catch (error) {
            console.error('Failed to load ACRA data:', error);
        }
        this.isLoaded = true;
    }
    enrich(initialData) {
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
exports.AcraEnrichmentService = AcraEnrichmentService;
