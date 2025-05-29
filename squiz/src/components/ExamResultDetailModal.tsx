import React, { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ChampionIcon,
  Target03Icon,
  Chart02Icon,
  Award01Icon,
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
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setShowContent(true), 100);
      // Prevent scrolling when modal is open
      document.body.style.overflow = "hidden";
    } else {
      setShowContent(false);
      setTimeout(() => setIsVisible(false), 300);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = "unset";
    }

    // Cleanup function to ensure scrolling is re-enabled when component unmounts
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleClose = () => {
    setShowContent(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 300);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800 border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500";
    if (percentage >= 60) return "text-yellow-300";
    return "text-red-800";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        showContent ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
    >
      <div
        className={`
        bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl
        transform transition-all duration-300 ease-out
        ${
          showContent
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }
      `}
      >
        {/* Enhanced Header with Gradient */}
        <div className="relative bg-gradient-to-r from-orange to-red-600 text-white p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-3xl font-bold mb-2 leading-tight">
                  {result.quizRoom.quiz.name}
                </h2>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                    📚 {result.quizRoom.quiz.topic}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(
                      result.quizRoom.quiz.difficulty
                    )} bg-white`}
                  >
                    {result.quizRoom.quiz.difficulty}
                  </span>
                  {result.quizRoom.roomCode && (
                    <span className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium">
                      🏠 {result.quizRoom.roomCode}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={24} />
              </button>
            </div>

            {/* Score Display */}
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <HugeiconsIcon
                  icon={ChampionIcon}
                  className="text-yellow-300"
                  size={28}
                />
                <span className="text-2xl font-bold">
                  {result.score}/{result.stats.totalQuestions}
                </span>
              </div>
              <div
                className={`text-3xl font-bold ${getScoreColor(
                  result.stats.correctPercentage
                )}`}
              >
                {result.stats.correctPercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Stats Cards */}
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <HugeiconsIcon
                      icon={Chart02Icon}
                      className="text-orange"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tổng số câu</p>
                    <p className="text-xl font-bold text-gray-900">
                      {result.stats.totalQuestions}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      className="text-green-600"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Câu đúng</p>
                    <p className="text-xl font-bold text-green-600">
                      {result.stats.correctAnswers}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      className="text-red-600"
                      size={20}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Câu sai</p>
                    <p className="text-xl font-bold text-red-600">
                      {result.stats.incorrectAnswers}
                    </p>
                  </div>
                </div>
              </div>

              {result.stats && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <HugeiconsIcon
                        icon={Clock01Icon}
                        className="text-purple-600"
                        size={20}
                      />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Thời gian</p>
                      <p className="text-xl font-bold text-purple-600">
                        {formatTime(result.stats.timeSpent || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Questions Review */}
          {result.submissions && result.submissions.length > 0 ? (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <HugeiconsIcon
                  icon={Target03Icon}
                  className="text-orange"
                  size={24}
                />
                <h3 className="text-2xl font-bold text-gray-900">
                  Chi tiết từng câu hỏi
                </h3>
              </div>

              <div className="space-y-6">
                {result.submissions.map((submission, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                  >
                    <div
                      className={`p-4 border-l-4 ${
                        submission.isCorrect
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`
                          p-2 rounded-full flex-shrink-0
                          ${
                            submission.isCorrect ? "bg-green-100" : "bg-red-100"
                          }
                        `}
                        >
                          {submission.isCorrect ? (
                            <HugeiconsIcon
                              icon={CheckmarkCircle02Icon}
                              className="text-green-600"
                              size={20}
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={Cancel01Icon}
                              className="text-red-600"
                              size={20}
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-gray-900">
                              Câu {index + 1}
                            </span>
                            <span
                              className={`
                              px-2 py-1 rounded-full text-xs font-medium
                              ${
                                submission.isCorrect
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            `}
                            >
                              {submission.isCorrect ? "Đúng" : "Sai"}
                            </span>
                          </div>

                          <p className="text-gray-800 font-medium mb-4 text-lg leading-relaxed">
                            {submission.question.questionText}
                          </p>

                          <div className="space-y-2">
                            {submission.question.answers.map(
                              (answer, ansIndex) => {
                                const isUserAnswer =
                                  submission.answer === answer.text;
                                const isCorrect = answer.isCorrect;

                                return (
                                  <div
                                    key={ansIndex}
                                    className={`
                                    p-3 rounded-lg border-2 transition-all duration-200
                                    ${
                                      isCorrect
                                        ? "bg-green-50 border-green-200 text-green-800"
                                        : isUserAnswer
                                        ? "bg-red-50 border-red-200 text-red-800"
                                        : "bg-gray-50 border-gray-200 text-gray-700"
                                    }
                                  `}
                                  >
                                    <div className="flex items-center gap-3">
                                      {isCorrect && (
                                        <HugeiconsIcon
                                          icon={CheckmarkCircle02Icon}
                                          className="text-green-600 flex-shrink-0"
                                          size={16}
                                        />
                                      )}
                                      {!isCorrect && isUserAnswer && (
                                        <HugeiconsIcon
                                          icon={Cancel01Icon}
                                          className="text-red-600 flex-shrink-0"
                                          size={16}
                                        />
                                      )}
                                      <span className="font-medium">
                                        {answer.text}
                                      </span>
                                      {isUserAnswer && !isCorrect && (
                                        <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                          Lựa chọn của bạn
                                        </span>
                                      )}
                                      {isCorrect && (
                                        <span className="ml-auto text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                                          Đáp án đúng
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <HugeiconsIcon
                icon={Award01Icon}
                className="mx-auto text-gray-400 mb-4"
                size={48}
              />
              <p className="text-xl text-gray-500">Không có dữ liệu chi tiết</p>
              <p className="text-gray-400">
                Thông tin chi tiết không khả dụng cho bài thi này
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
