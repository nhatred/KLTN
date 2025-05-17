import { Question } from "./Question";
export interface Quiz {
  _id: string;
  imageUrl: string;
  name: string;
  difficulty: string;
  questions: Question[];
  topic: string;
  createdAt: string;
  totalPlays: number;
  creator: string;
  isPublic: string;
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
