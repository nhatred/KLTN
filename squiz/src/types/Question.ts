export interface Question {
  _id?: string;
  questionId: number;
  quizId: string;
  questionType: string;
  questionText: string;
  timePerQuestion: number;
  scorePerQuestion: number;
  difficulty: string;
  answers: answers[];
}

export interface answers {
  text: string;
  isCorrect: boolean;
}
