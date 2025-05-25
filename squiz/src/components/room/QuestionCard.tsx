import React from "react";
import { Question } from "../../types/Question";

interface QuestionCardProps {
  question: Question;
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <h3 className="text-xl font-semibold text-white mb-4">
        {question.questionText}
      </h3>
      <div className="space-y-3">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onAnswerSelect(answer.text)}
            className={`w-full p-4 rounded-lg text-left transition-colors ${
              selectedAnswer === answer.text
                ? "bg-orange text-darkblue"
                : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            {answer.text}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionCard;
