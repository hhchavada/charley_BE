import { Router } from 'express';
import { getGrants, updateGrants, getQuestions, updateQuestions } from '../controllers/admin.controller';

const router = Router();

router.get('/grants', getGrants);
router.post('/grants', updateGrants);

router.get('/questions', getQuestions);
router.post('/questions', updateQuestions);

export default router;
