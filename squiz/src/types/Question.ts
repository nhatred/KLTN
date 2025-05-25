export interface Question {
  _id: string;
  questionText: string;
  questionType: string;
  difficulty: string;
  answers: Answer[];
  timePerQuestion?: number;
  scorePerQuestion?: number;
  quizId?: string;
  questionId?: number;
}

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface SubmittedAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}
