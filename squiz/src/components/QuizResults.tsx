import { useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ChampionIcon,
  Chart02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Backward01Icon,
  ClockIcon,
  CheckmarkCircleIcon,
  Cancel01Icon as CloseCircleIcon,
} from "@hugeicons/core-free-icons";
import { useNavigate } from "react-router";

interface Answer {
  questionId: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  question?: string;
}

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  stats: {
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
  };
  answers: Answer[];
  questions: Array<{
    _id: string;
    questionText: string;
    answers: Array<{
      text: string;
      isCorrect: boolean;
    }>;
  }>;
}

export default function QuizResults({
  score,
  totalQuestions,
  stats,
  answers,
  questions,
}: QuizResultsProps) {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(true); // Mặc định hiển thị chi tiết

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background p-6">
      <motion.div
        className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="">
            <h2 className="text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                Kết quả
              </span>
              <span className="text-white"> bài thi</span>
            </h2>
            <p className="text-gray-400 mt-2">
              Xem chi tiết kết quả bài làm của bạn
            </p>
          </div>
          <div className="flex items-center gap-4">
            <HugeiconsIcon
              icon={ChampionIcon}
              size={40}
              className="text-orange"
            />
          </div>
        </motion.div>

        {/* Score Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Score Card */}
          <motion.div
            variants={itemVariants}
            className="bg-rgba p-6 rounded-xl shadow-lg hover:shadow-indigo-900/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-background font-medium">Điểm số</p>
              <HugeiconsIcon
                icon={Chart02Icon}
                size={24}
                className="text-orange"
              />
            </div>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange to-red-wine">
              {score}/{totalQuestions}
            </p>
            <p className="text-gray-400 text-sm mt-2">Tổng điểm đạt được</p>
          </motion.div>

          {/* Progress Card */}
          <motion.div
            variants={itemVariants}
            className="bg-rgba p-6 rounded-xl shadow-lg hover:shadow-indigo-900/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-background font-medium">Tỷ lệ đúng</p>
              <div className="bg-orange text-darkblue text-xs font-bold px-3 py-1 rounded-full">
                {stats.correctPercentage}%
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.correctPercentage}%` }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-orange to-red-wine h-3 rounded-full"
              />
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <span className="text-gray-400">
                Đúng: {stats.correctAnswers}
              </span>
              <span className="text-gray-400">
                Sai: {stats.incorrectAnswers}
              </span>
            </div>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            variants={itemVariants}
            className="bg-rgba p-6 rounded-xl shadow-lg hover:shadow-indigo-900/20 transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-background font-medium">Thống kê</p>
              <HugeiconsIcon
                icon={ClockIcon}
                size={24}
                className="text-orange"
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Tổng câu hỏi:</span>
                <span className="font-medium text-white">{totalQuestions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Đã trả lời:</span>
                <span className="font-medium text-white">{answers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Chưa trả lời:</span>
                <span className="font-medium text-white">
                  {totalQuestions - answers.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Answers Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-orange hover:text-amber-500 transition-colors mb-4"
          >
            <span className="font-medium">Chi tiết bài làm</span>
            <HugeiconsIcon
              icon={showDetails ? ArrowUp01Icon : ArrowDown01Icon}
              size={20}
            />
          </button>

          {showDetails && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {answers.map((answer, index) => {
                const question = questions.find(
                  (q) => q._id === answer.questionId
                );
                if (!question) return null;

                return (
                  <motion.div
                    key={answer.questionId}
                    variants={itemVariants}
                    className="bg-rgba p-6 rounded-xl shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-gray-400">Câu {index + 1}</span>
                          {answer.isCorrect ? (
                            <HugeiconsIcon
                              icon={CheckmarkCircleIcon}
                              size={20}
                              className="text-green-500"
                            />
                          ) : (
                            <HugeiconsIcon
                              icon={CloseCircleIcon}
                              size={20}
                              className="text-red-500"
                            />
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-white mb-4">
                          {question.questionText}
                        </h3>

                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 min-w-[120px]">
                              Đáp án của bạn:
                            </span>
                            <span
                              className={`flex-1 ${
                                answer.isCorrect
                                  ? "text-green-500"
                                  : "text-red-500"
                              }`}
                            >
                              {answer.userAnswer || "Không có đáp án"}
                            </span>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-gray-400 min-w-[120px]">
                              Đáp án đúng:
                            </span>
                            <span className="text-green-500 flex-1">
                              {answer.correctAnswer}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rgba">
                        {answer.isCorrect ? (
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={24}
                            className="text-green-500"
                          />
                        ) : (
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            size={24}
                            className="text-red-500"
                          />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-orange hover:text-amber-500 transition-colors"
          >
            <HugeiconsIcon icon={Backward01Icon} size={20} />
            <span>Quay về trang chủ</span>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
