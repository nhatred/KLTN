import { createContext, useContext, ReactNode, useState } from 'react';
import { QuizHistory } from '../types/Quiz';


interface QuizContextType {
  quizHistory: QuizHistory[];
  setQuizHistory: (history: QuizHistory[]) => void;
}

const QuizContext = createContext<QuizContextType | undefined>(undefined);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);

  return (
    <QuizContext.Provider value={{ quizHistory, setQuizHistory }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
} 