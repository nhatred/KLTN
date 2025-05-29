import { Question } from "./Question";
export interface Quiz {
  _id: string;
  imageUrl: string;
  name: string;
  difficulty?: string;
  questions?: Question[];
  questionBankQueries?: any[];
  topic: string;
  createdAt: string;
  isExam: boolean;
  duration?: number;
  totalPlays: number;
  creator: string;
  isPublic: boolean;
  description?: string;
  quizRating: [];
  scorePerQuestion: 1;
  timePerQuestion: 30;
  favorites?: string[]; // Array of user IDs who favorited this quiz
  creatorInfo: {
    name: string;
    avatar: string;
  };
}

export interface QuizHistory {
  participationId: string;
  quiz: Quiz;
  score: number;
  joinedAt: string;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
  };
}
