"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env
dotenv.config({ path: path_1.default.join(__dirname, '../../../.env') });
const SystemConfig_1 = require("../../models/v2/SystemConfig");
const PromptTemplate_1 = require("../../models/v2/PromptTemplate");
const Question_1 = require("../../models/v2/Question");
const Rule_1 = require("../../models/v2/Rule");
const RuleGroup_1 = require("../../models/v2/RuleGroup");
const Grant_1 = require("../../models/v2/Grant");
const data_1 = require("./data");
async function seed() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/grant_matching_engine';
    await mongoose_1.default.connect(uri);
    console.log('Connected to MongoDB');
    try {
        // 1. Seed Configs
        for (const config of data_1.SEED_SYSTEM_CONFIGS) {
            await SystemConfig_1.SystemConfig.findOneAndUpdate({ key: config.key }, { $set: config }, { upsert: true });
        }
        console.log('Seeded System Configs');
        // 2. Seed Prompts
        for (const prompt of data_1.SEED_PROMPTS) {
            await PromptTemplate_1.PromptTemplate.findOneAndUpdate({ templateId: prompt.templateId }, { $set: prompt }, { upsert: true });
        }
        console.log('Seeded Prompts');
        // 3. Seed Questions
        const questionIdMap = new Map();
        for (const q of data_1.SEED_QUESTIONS) {
            const doc = await Question_1.Question.findOneAndUpdate({ questionId: q.questionId }, { $set: q }, { upsert: true, new: true });
            questionIdMap.set(q.questionId, doc._id);
        }
        console.log('Seeded Questions');
        // 4. Seed Rules
        const ruleIdMap = new Map();
        for (const r of data_1.SEED_RULES) {
            const qMongoId = questionIdMap.get(r.questionId);
            const doc = await Rule_1.Rule.findOneAndUpdate({ ruleId: r.ruleId }, { $set: { ...r, questionId: qMongoId } }, { upsert: true, new: true });
            ruleIdMap.set(r.ruleId, doc._id);
        }
        console.log('Seeded Rules');
        // 5. Seed Rule Groups
        const groupDoc = await RuleGroup_1.RuleGroup.findOneAndUpdate({ groupId: 'rg_sme_base' }, {
            $set: {
                groupId: 'rg_sme_base',
                logic: 'AND',
                rules: Array.from(ruleIdMap.values()),
                nestedGroups: []
            }
        }, { upsert: true, new: true });
        console.log('Seeded Rule Groups');
        // 6. Seed Grants
        await Grant_1.Grant.findOneAndUpdate({ grantId: 'g_sme_base' }, {
            $set: {
                grantId: 'g_sme_base',
                name: 'Base SME Grant',
                description: 'Basic grant for all SMEs',
                agency: 'EnterpriseSG',
                category: 'General',
                priority: 1,
                status: 'DRAFT',
                version: 1,
                ruleGroupId: groupDoc._id
            }
        }, { upsert: true });
        console.log('Seeded Grants');
        console.log('Seeding completed successfully!');
    }
    catch (error) {
        console.error('Error during seeding:', error);
    }
    finally {
        await mongoose_1.default.disconnect();
    }
}
if (require.main === module) {
    seed();
}
