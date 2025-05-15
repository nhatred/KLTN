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
}
