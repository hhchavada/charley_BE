export enum SessionState {
  NEW = 'NEW',
  IN_PROGRESS = 'IN_PROGRESS',
  PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED',
  WAITING_FOR_USER = 'WAITING_FOR_USER',
  READY_FOR_EVALUATION = 'READY_FOR_EVALUATION',
  EVALUATING = 'EVALUATING',
  AI_REQUIRED = 'AI_REQUIRED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface SessionTimelineEvent {
  eventId: string;
  type: 'CREATED' | 'ANSWER_SUBMITTED' | 'EVALUATION_STARTED' | 'EVALUATION_FINISHED' | 'AI_STARTED' | 'AI_FINISHED' | 'STATE_CHANGED' | 'COMPLETED';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AssessmentSession {
  sessionId: string;
  userId: string;
  state: SessionState;
  payload: Record<string, any>; // The combined answers
  configVersionId: string;
  timeline: SessionTimelineEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISessionRepository {
  findById(sessionId: string): Promise<AssessmentSession | null>;
  save(session: AssessmentSession, currentUpdatedAt: Date): Promise<AssessmentSession>;
}
