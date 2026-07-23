"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssessmentController = void 0;
class AssessmentController {
    assessmentService;
    acraService;
    normalizerService;
    constructor(assessmentService, acraService, normalizerService) {
        this.assessmentService = assessmentService;
        this.acraService = acraService;
        this.normalizerService = normalizerService;
    }
    startAssessment = async (req, res) => {
        try {
            const requestDto = req.body;
            if (!requestDto.userId) {
                res.status(400).json({ error: 'userId is required' });
                return;
            }
            // We need to inject the initialData into the session if provided
            const response = await this.assessmentService.startAssessment(requestDto);
            // Submit initial answers immediately if provided
            if (req.body.initialData) {
                const enrichedData = this.acraService.enrich(req.body.initialData);
                const normalizedData = this.normalizerService.normalize(enrichedData);
                await this.assessmentService.submitAnswers(response.sessionId, { answers: normalizedData });
            }
            // Trigger the existing evaluation pipeline
            const finalResponse = await this.assessmentService.evaluate(response.sessionId);
            const questions = finalResponse.evaluation?.questions || [];
            const firstQuestion = questions.length > 0 ? questions[0] : null;
            res.status(201).json({
                sessionId: finalResponse.sessionId,
                firstQuestion,
                completed: !firstQuestion // If there are no missing questions, we're done
            });
        }
        catch (error) {
            console.error("ASSESSMENT CONTROLLER ERROR:", error);
            res.status(500).json({ error: error.message });
        }
    };
    submitAnswers = async (req, res) => {
        try {
            const sessionId = req.params.sessionId;
            const requestDto = req.body;
            if (!requestDto.answers) {
                res.status(400).json({ error: 'answers payload is required' });
                return;
            }
            await this.assessmentService.submitAnswers(sessionId, requestDto);
            // Trigger the existing evaluation pipeline
            const finalResponse = await this.assessmentService.evaluate(sessionId);
            const questions = finalResponse.evaluation?.questions || [];
            const nextQuestion = questions.length > 0 ? questions[0] : null;
            if (!nextQuestion) {
                res.status(200).json({ completed: true });
                return;
            }
            res.status(200).json({
                nextQuestion,
                completed: false
            });
        }
        catch (error) {
            if (error.name === 'OptimisticLockError' || error.name === 'InvalidStateTransitionError') {
                res.status(409).json({ error: error.message });
            }
            else if (error.name === 'SessionValidationError') {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: error.message });
            }
        }
    };
    evaluate = async (req, res) => {
        try {
            const sessionId = req.params.sessionId;
            const response = await this.assessmentService.evaluate(sessionId);
            res.status(200).json(response);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    };
    getAssessment = async (req, res) => {
        try {
            const sessionId = req.params.sessionId;
            const response = await this.assessmentService.getAssessment(sessionId);
            res.status(200).json(response);
        }
        catch (error) {
            res.status(404).json({ error: 'Session not found or error loading session.' });
        }
    };
}
exports.AssessmentController = AssessmentController;
