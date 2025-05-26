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
            className="flex items-center justify-between w-full py-4 px-6 bg-rgba rounded-xl transition mb-4 hover:bg-rgba/70"
          >
            <div className="flex items-center">
              <h3 className="text-xl font-semibold text-background">
                Chi tiết câu trả lời
              </h3>
              <span className="ml-3 bg-orange px-3 py-1 rounded-lg text-sm text-darkblue font-medium">
                {answers.length} câu hỏi
              </span>
            </div>
            <HugeiconsIcon
              icon={showDetails ? ArrowUp01Icon : ArrowDown01Icon}
              size={24}
              className="text-orange"
            />
          </button>

          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 max-h-[40vh] overflow-y-auto pb-2 pr-2 custom-scrollbar"
            >
              {answers.map((answer, index) => {
                const question = questions.find(
                  (q) => q._id === answer.questionId
                );
                const allAnswers = question?.answers || [];

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-5 rounded-xl border ${
                      answer.isCorrect
                        ? "bg-green-950/50 border-green-700/50"
                        : "bg-red-950/50 border-red-700/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="grid grid-cols-12 items-center gap-3">
                        <span className="bg-orange text-darkblue text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center">
                          {index + 1}
                        </span>

                        <p className="text-cyan-100 text-lg col-span-10">
                          {question?.questionText || "Câu hỏi không có sẵn"}
                        </p>
                      </div>
                      {answer.isCorrect ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <HugeiconsIcon icon={CheckmarkCircleIcon} size={24} />
                          <span className="font-medium">Đúng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-400">
                          <HugeiconsIcon icon={CloseCircleIcon} size={24} />
                          <span className="font-medium">Sai</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 bg-black/20 p-4 rounded-lg">
                      {allAnswers.map((ans, ansIndex) => (
                        <div
                          key={ansIndex}
                          className={`p-3 rounded-lg flex items-center justify-between ${
                            ans.text === answer.userAnswer
                              ? ans.isCorrect
                                ? "bg-green-900/30 border border-green-500/30"
                                : "bg-red-900/30 border border-red-500/30"
                              : ans.isCorrect
                              ? "bg-green-900/30 border border-green-500/30"
                              : "bg-gray-800/30"
                          }`}
                        >
                          <span className="text-gray-200">{ans.text}</span>
                          <div className="flex items-center gap-2">
                            {ans.text === answer.userAnswer && (
                              <span className="text-sm text-gray-400">
                                Câu trả lời của bạn
                              </span>
                            )}
                            {ans.isCorrect && (
                              <span className="text-sm text-emerald-400">
                                Đáp án đúng
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between"
        >
          <button
            onClick={() => navigate("/dashboard/home")}
            className="flex items-center px-5 py-3 bg-background text-darkblue rounded-xl font-medium hover:bg-gray-100 transition-colors"
          >
            <HugeiconsIcon icon={Backward01Icon} size={20} />
            <span className="ml-2">Quay lại trang chủ</span>
          </button>

          <button
            onClick={() => navigate("/dashboard/activity")}
            className="px-6 py-3 bg-orange text-darkblue rounded-xl font-semibold hover:bg-amber-500 transition-colors"
          >
            Đến trang hoạt động
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
