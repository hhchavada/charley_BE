import { QuestionDef } from '../types';
import { RuleEngine } from './RuleEngine';

export class QuestionEngine {
  public static isQuestionVisible(q: QuestionDef, formData: Record<string, any>): boolean {
    if (q.isHidden) return false;

    if (!q.conditions || q.conditions.length === 0) {
      return true;
    }

    const logic = q.conditionLogic || 'AND';
    const results = q.conditions.map(cond => {
      const actual = RuleEngine.getFieldValue(formData, cond.field);
      return RuleEngine.evaluate(cond.operator, cond.value, actual);
    });

    if (logic === 'AND') {
      return results.every(res => res === true);
    } else {
      return results.some(res => res === true);
    }
  }

  public static getVisibleQuestions(questions: QuestionDef[], formData: Record<string, any>): QuestionDef[] {
    const visible: QuestionDef[] = [];
    
    for (const q of questions) {
      if (this.isQuestionVisible(q, formData)) {
        visible.push(q);
        if (q.followUpQuestions && q.followUpQuestions.length > 0) {
          visible.push(...this.getVisibleQuestions(q.followUpQuestions, formData));
        }
      }
    }
    
    return visible;
  }
}
