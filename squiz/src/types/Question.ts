export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface Question {
  _id?: string;
  questionId: string | number;
  quizId?: string;
  questionType: string;
  questionText: string;
  timePerQuestion: number;
  scorePerQuestion: number;
  difficulty: "easy" | "medium" | "hard";
  answers: Answer[];
}

export interface SubmittedAnswer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}
