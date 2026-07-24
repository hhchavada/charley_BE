"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const match_routes_1 = __importDefault(require("./routes/match.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api', match_routes_1.default);
const assessment_routes_1 = require("./routes/v2/assessment.routes");
const factory_1 = require("./engine/v2/factory");
app.use('/api/admin', admin_routes_1.default);
const assessmentController = factory_1.V2Factory.createAssessmentController();
app.use('/api/v2/assessment', (0, assessment_routes_1.createAssessmentRoutes)(assessmentController));
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});
exports.default = app;
