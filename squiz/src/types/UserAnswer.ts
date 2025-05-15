export interface UserAnswer {
  questionIndex: number;
  userAnswer: number;
  correct: boolean;
  questionId?: string;
  score?: number;
  timeToAnswer?: number;
}