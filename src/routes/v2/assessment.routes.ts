import { Router } from 'express';
import { AssessmentController } from '../../controllers/v2/AssessmentController';

// Note: The actual AssessmentService and Controller instances should be injected via a DI container.
// This is a placeholder for the router structure.
export function createAssessmentRoutes(controller: AssessmentController): Router {
  const router = Router();

  router.post('/start', controller.startAssessment);
  router.post('/:sessionId/answer', controller.submitAnswers);
  router.post('/:sessionId/evaluate', controller.evaluate);
  router.post('/:sessionId/recalculate', controller.evaluate); // Semantically recalculate is just evaluate again
  router.get('/:sessionId', controller.getAssessment);

  return router;
}
