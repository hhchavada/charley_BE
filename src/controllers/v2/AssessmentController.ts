import { Request, Response } from 'express';
import { AssessmentService } from '../../services/v2/AssessmentService';
import { AcraEnrichmentService } from '../../services/v2/AcraEnrichmentService';
import { CompanyProfileNormalizer } from '../../services/v2/CompanyProfileNormalizer';
import { StartAssessmentRequest, AnswerRequest } from '../../services/v2/dto';

export class AssessmentController {
  constructor(
    private readonly assessmentService: AssessmentService,
    private readonly acraService: AcraEnrichmentService,
    private readonly normalizerService: CompanyProfileNormalizer
  ) {}

  public startAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const requestDto: StartAssessmentRequest = req.body;
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
    } catch (error: any) {
      console.error("ASSESSMENT CONTROLLER ERROR:", error);
      res.status(500).json({ error: error.message });
    }
  };

  public submitAnswers = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = (req.params.sessionId as string);
      const requestDto: AnswerRequest = req.body;

      if (!requestDto.answers) {
        res.status(400).json({ error: 'answers payload is required' });
        return;
      }

      await this.assessmentService.submitAnswers(sessionId, requestDto);
      
      // Trigger the existing evaluation pipeline
      const finalResponse = await this.assessmentService.evaluate(sessionId as string);
      
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
    } catch (error: any) {
      if (error.name === 'OptimisticLockError' || error.name === 'InvalidStateTransitionError') {
        res.status(409).json({ error: error.message });
      } else if (error.name === 'SessionValidationError') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: error.message });
      }
    }
  };

  public evaluate = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const response = await this.assessmentService.evaluate(sessionId as string);
      res.status(200).json(response);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };

  public getAssessment = async (req: Request, res: Response): Promise<void> => {
    try {
      const sessionId = req.params.sessionId;
      const response = await this.assessmentService.getAssessment(sessionId as string);
      res.status(200).json(response);
    } catch (error: any) {
      res.status(404).json({ error: 'Session not found or error loading session.' });
    }
  };
}
