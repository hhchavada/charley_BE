import { AssessmentSession, SessionTimelineEvent } from './interfaces';

export class SessionTimeline {
  /**
   * Appends a new chronological event to the session's timeline.
   */
  public addEvent(
    session: AssessmentSession, 
    type: SessionTimelineEvent['type'], 
    metadata?: Record<string, any>
  ): void {
    const event: SessionTimelineEvent = {
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      type,
      timestamp: new Date(),
      metadata
    };

    session.timeline.push(event);
  }

  /**
   * Reconstructs the duration of the evaluation phase.
   */
  public getEvaluationDurationMs(session: AssessmentSession): number {
    const events = session.timeline;
    let start: Date | null = null;
    let end: Date | null = null;

    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === 'EVALUATION_FINISHED' && !end) end = events[i].timestamp;
      if (events[i].type === 'EVALUATION_STARTED' && !start) start = events[i].timestamp;
      if (start && end) break;
    }

    if (start && end) {
      return end.getTime() - start.getTime();
    }
    return 0;
  }
}
