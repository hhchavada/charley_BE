import { Router } from 'express';
import { matchGrants } from '../controllers/match.controller';

const router = Router();

router.post('/match', matchGrants);

export default router;
