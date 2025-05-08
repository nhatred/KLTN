export interface Question {
  questionId: number;
  quizId: string;
  questionType: string;
  questionText: string;
  timePerQuestion: number;
  scorePerQuestion: number;
  difficulty: string;
  answers: any[];
}
