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
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background">
      <div className="bg-black/50 backdrop-blur-sm rounded-3xl p-8 max-w-4xl w-full mx-4 shadow-2xl transform transition-all">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
              Kết quả
            </span>{" "}
            bài thi
          </h2>
          <HugeiconsIcon icon={ChampionIcon} size={32} />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-rgba p-6 rounded-xl shadow-lg hover:shadow-indigo-900/20 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-background font-medium">Điểm số</p>
              <HugeiconsIcon icon={Chart02Icon} size={24} />
            </div>
            <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange to-red-wine">
              {score}/{totalQuestions}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-rgba col-span-2 p-6 rounded-xl transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-background font-medium">Tỷ lệ đúng</p>
              <div className="bg-orange text-darkblue text-xs font-bold px-2 py-1 rounded-full">
                {stats.correctPercentage}%
              </div>
            </div>
            <div className="w-full bg-gray-500 rounded-full h-3 mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.correctPercentage}%` }}
                transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-orange to-red-wine h-3 rounded-full"
              />
            </div>
            <p className="text-xl font-medium text-orange mt-2">
              {stats.correctAnswers}/{totalQuestions} câu đúng
            </p>
          </motion.div>
        </div>

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
              <span className="ml-3 bg-background px-2 py-1 rounded-lg text-sm text-darkblue">
                {0} câu hỏi
              </span>
            </div>
            <HugeiconsIcon
              icon={showDetails ? ArrowUp01Icon : ArrowDown01Icon}
              size={24}
            />
          </button>

          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar"
            >
              {answers.map((answer, index) => {
                const question = questions.find(
                  (q) => q._id === answer.questionId
                );
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-5 rounded-xl border ${
                      answer.isCorrect
                        ? "bg-green-950/50 border-green-700/50 shadow-md shadow-green-900/20"
                        : "bg-red-950/50 border-red-700/50 shadow-md shadow-red-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium text-lg text-cyan-100">
                        Câu {index + 1}
                      </p>
                      {answer.isCorrect ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                          <HugeiconsIcon
                            icon={CheckmarkCircle02Icon}
                            size={20}
                          />
                          <span className="text-sm font-medium">Đúng</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-rose-400">
                          <HugeiconsIcon icon={Cancel01Icon} size={20} />
                          <span className="text-sm font-medium">Sai</span>
                        </div>
                      )}
                    </div>

                    <p className="text-cyan-100 mb-3">
                      {question?.questionText || "Câu hỏi không có sẵn"}
                    </p>

                    <div className="space-y-2 ml-2">
                      <p className="text-sm flex items-center">
                        <span
                          className={`inline-block w-3 h-3 rounded-full mr-2 ${
                            answer.userAnswer === answer.correctAnswer
                              ? "bg-emerald-400"
                              : "bg-rose-400"
                          }`}
                        ></span>
                        <span className="text-cyan-300">Đáp án của bạn:</span>
                        <span className="ml-1 font-medium text-white">
                          {answer.userAnswer}
                        </span>
                      </p>

                      {!answer.isCorrect && (
                        <p className="text-sm flex items-center">
                          <span className="inline-block w-3 h-3 rounded-full mr-2 bg-emerald-400"></span>
                          <span className="text-cyan-300">Đáp án đúng:</span>
                          <span className="ml-1 font-medium text-white">
                            {answer.correctAnswer}
                          </span>
                        </p>
                      )}
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
      </div>
    </div>
  );
}
