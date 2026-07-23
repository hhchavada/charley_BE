export interface StartAssessmentRequest {
  userId: string;
  versionId?: string; // Optional: defaults to 'active' or 'latest'
}

export interface AnswerRequest {
  answers: Record<string, any>;
}

export interface AssessmentResponse {
  sessionId: string;
  state: string; // 'NEW', 'IN_PROGRESS', 'EVALUATING', 'WAITING_FOR_USER', 'COMPLETED'
  payload: Record<string, any>;
  evaluation?: {
    summary: any;
    recommendations: {
      readyNow: any[];
      needsInformation: any[];
      prepareNext: any[];
      windowClosed: any[];
      hidden: any[];
    };
    questions: any[];
    funding: any;
    metadata: any;
  };
}
