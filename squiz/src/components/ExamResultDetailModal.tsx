import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";

interface ExamResultDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    participationId: string;
    quizRoom: {
      quiz: {
        name: string;
        topic: string;
        difficulty: string;
      };
      roomCode?: string;
      durationMinutes: number;
    };
    score: number;
    stats: {
      totalQuestions: number;
      correctAnswers: number;
      incorrectAnswers: number;
      correctPercentage: number;
      timeSpent?: number;
    };
    submissions?: Array<{
      question: {
        questionText: string;
        answers: Array<{
          text: string;
          isCorrect: boolean;
        }>;
      };
      answer: string;
      isCorrect: boolean;
      score: number;
    }>;
  };
}

export default function ExamResultDetailModal({
  isOpen,
  onClose,
  result,
}: ExamResultDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {result.quizRoom.quiz.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} />
            </button>
          </div>
          <div className="mt-2 flex gap-2">
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
              {result.quizRoom.quiz.topic}
            </span>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
              {result.quizRoom.quiz.difficulty}
            </span>
            {result.quizRoom.roomCode && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                Mã phòng: {result.quizRoom.roomCode}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Tổng quan</h3>
              <div className="space-y-2">
                <p>
                  Điểm số: {result.score}/{result.stats.totalQuestions}
                </p>
                <p>Tỷ lệ đúng: {result.stats.correctPercentage}%</p>
                {result.stats.timeSpent && (
                  <p>
                    Thời gian làm bài: {Math.floor(result.stats.timeSpent / 60)}{" "}
                    phút {result.stats.timeSpent % 60} giây
                  </p>
                )}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">Chi tiết</h3>
              <div className="space-y-2">
                <p>Tổng số câu: {result.stats.totalQuestions}</p>
                <p className="text-green-500">
                  Số câu đúng: {result.stats.correctAnswers}
                </p>
                <p className="text-red-500">
                  Số câu sai: {result.stats.incorrectAnswers}
                </p>
              </div>
            </div>
          </div>

          {/* Questions and Answers */}
          {result.submissions && result.submissions.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Chi tiết từng câu</h3>
              {result.submissions.map((submission, index) => (
                <div
                  key={index}
                  className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {submission.isCorrect ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={20}
                          className="text-green-500"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={20}
                          className="text-red-500"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium mb-2">
                        Câu {index + 1}: {submission.question.questionText}
                      </p>
                      <div className="space-y-2">
                        {submission.question.answers.map((answer, ansIndex) => (
                          <div
                            key={ansIndex}
                            className={`p-2 rounded ${
                              answer.isCorrect
                                ? "bg-green-100 dark:bg-green-900/20"
                                : submission.answer === answer.text
                                ? "bg-red-100 dark:bg-red-900/20"
                                : "bg-gray-100 dark:bg-gray-600/20"
                            }`}
                          >
                            <p className="flex items-center gap-2">
                              {answer.isCorrect && (
                                <HugeiconsIcon
                                  icon={CheckmarkCircle02Icon}
                                  size={16}
                                  className="text-green-500"
                                />
                              )}
                              {!answer.isCorrect &&
                                submission.answer === answer.text && (
                                  <HugeiconsIcon
                                    icon={Cancel01Icon}
                                    size={16}
                                    className="text-red-500"
                                  />
                                )}
                              {answer.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">
              Không có dữ liệu chi tiết
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
