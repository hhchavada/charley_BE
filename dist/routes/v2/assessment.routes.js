"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssessmentRoutes = createAssessmentRoutes;
const express_1 = require("express");
// Note: The actual AssessmentService and Controller instances should be injected via a DI container.
// This is a placeholder for the router structure.
function createAssessmentRoutes(controller) {
    const router = (0, express_1.Router)();
    router.post('/start', controller.startAssessment);
    router.post('/:sessionId/answer', controller.submitAnswers);
    router.post('/:sessionId/evaluate', controller.evaluate);
    router.post('/:sessionId/recalculate', controller.evaluate); // Semantically recalculate is just evaluate again
    router.get('/:sessionId', controller.getAssessment);
    return router;
}
