import express from 'express';
import cors from 'cors';
import matchRoutes from './routes/match.routes';
import adminRoutes from './routes/admin.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', matchRoutes);
import { createAssessmentRoutes } from './routes/v2/assessment.routes';
import { V2Factory } from './engine/v2/factory';

app.use('/api/admin', adminRoutes);

const assessmentController = V2Factory.createAssessmentController();
app.use('/api/v2/assessment', createAssessmentRoutes(assessmentController));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
