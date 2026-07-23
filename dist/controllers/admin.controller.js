"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQuestions = exports.getQuestions = exports.updateGrants = exports.getGrants = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const GRANTS_PATH = path_1.default.join(__dirname, '../data/grants.json');
const QUESTIONS_PATH = path_1.default.join(__dirname, '../data/questions.json');
const getGrants = (req, res) => {
    try {
        const data = fs_1.default.readFileSync(GRANTS_PATH, 'utf-8');
        res.json(JSON.parse(data));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read grants' });
    }
};
exports.getGrants = getGrants;
const updateGrants = (req, res) => {
    try {
        const data = req.body;
        fs_1.default.writeFileSync(GRANTS_PATH, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update grants' });
    }
};
exports.updateGrants = updateGrants;
const getQuestions = (req, res) => {
    try {
        if (!fs_1.default.existsSync(QUESTIONS_PATH)) {
            return res.json([]);
        }
        const data = fs_1.default.readFileSync(QUESTIONS_PATH, 'utf-8');
        res.json(JSON.parse(data));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to read questions' });
    }
};
exports.getQuestions = getQuestions;
const updateQuestions = (req, res) => {
    try {
        const data = req.body;
        fs_1.default.writeFileSync(QUESTIONS_PATH, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update questions' });
    }
};
exports.updateQuestions = updateQuestions;
