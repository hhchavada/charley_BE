"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchGrants = void 0;
const GrantMatchingEngine_1 = require("../engine/GrantMatchingEngine");
const ValidationEngine_1 = require("../engine/ValidationEngine");
const ResultBuilder_1 = require("../engine/ResultBuilder");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const matchGrants = (req, res) => {
    try {
        const companyData = req.body;
        if (!companyData) {
            return res.status(400).json({ error: 'Company data is required' });
        }
        // Validation Phase
        const questionsFilePath = path_1.default.join(__dirname, '../data/questions.json');
        const questionsData = JSON.parse(fs_1.default.readFileSync(questionsFilePath, 'utf-8'));
        const validationResult = ValidationEngine_1.ValidationEngine.validate(companyData, questionsData);
        if (!validationResult.isValid) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationResult.errors
            });
        }
        // Matching Phase
        const engine = new GrantMatchingEngine_1.GrantMatchingEngine();
        const results = engine.match(companyData);
        const finalResponse = ResultBuilder_1.ResultBuilder.buildFinalResponse(results);
        return res.json(finalResponse);
    }
    catch (error) {
        console.error('Error matching grants:', error);
        return res.status(500).json({ error: 'Internal server error during grant matching' });
    }
};
exports.matchGrants = matchGrants;
