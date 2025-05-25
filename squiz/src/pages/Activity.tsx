import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Quiz } from "../types/Quiz";
import { format } from "date-fns";
import QuizDetailModal from "../components/QuizDetailModal";
import ExamResultDetailModal from "../components/ExamResultDetailModal";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  HelpSquareIcon,
  Chart02Icon,
  ClockIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  BookOpenIcon,
} from "@hugeicons/core-free-icons";
import { NavLink } from "react-router";
import "../style/quizcard.css";

interface QuizPracticeResult {
  participationId: string;
  quiz: {
    _id: string;
    name: string;
    imageUrl: string;
    difficulty: string;
    topic: string;
    totalPlays: number;
    createdAt: string;
    isExam: boolean;
  };
  score: number;
  joinedAt: string;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
  };
}

interface QuizRoomResult {
  participationId: string;
  quizRoom: {
    _id: string;
    name: string;
    roomCode: string;
    startTime: string;
    durationMinutes: number;
    status: string;
    quiz: {
      _id: string;
      name: string;
      topic: string;
      difficulty: string;
    };
  };
  score: number;
  joinedAt: string;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
    timeSpent: number;
  };
}

export default function Activity() {
  const { getToken, userId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExamDetailModalOpen, setIsExamDetailModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [selectedExamResult, setSelectedExamResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizPracticeResults, setQuizPracticeResults] = useState<
    QuizPracticeResult[]
  >([]);
  const [quizRoomResults, setQuizRoomResults] = useState<QuizRoomResult[]>([]);
  const [activeTab, setActiveTab] = useState<"practice" | "exam">("practice");

  const fetchQuizHistory = async () => {
    try {
      const token = await getToken();

      // Fetch quiz practice history
      const practiceResponse = await fetch(
        `http://localhost:5000/api/quiz/history/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const practiceData = await practiceResponse.json();

      // Fetch quiz room history
      const examResponse = await fetch(
        `http://localhost:5000/api/quizRoom/history/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const examData = await examResponse.json();

      if (practiceData.success) {
        console.log("Practice data:", practiceData.data);
        // Phân loại quiz dựa vào isExam và đã nộp bài
        const practiceQuizzes = practiceData.data.filter(
          (history: QuizPracticeResult) =>
            !history.quiz.isExam && history.stats.totalQuestions > 0
        );
        const examQuizzes = practiceData.data
          .filter(
            (history: QuizPracticeResult) =>
              history.quiz.isExam && history.stats.totalQuestions > 0
          )
          .map((history: QuizPracticeResult) => ({
            participationId: history.participationId,
            quizRoom: {
              quiz: history.quiz,
              roomCode: "N/A",
              durationMinutes: 0,
            },
            score: history.score,
            joinedAt: history.joinedAt,
            stats: {
              ...history.stats,
              timeSpent: 0,
            },
          }));

        setQuizPracticeResults(practiceQuizzes);
        // Kết hợp quiz exam từ practice và quiz room
        if (examData.success) {
          console.log("Exam data:", examData.data);
          // Lọc quizRoom results để chỉ lấy những bài đã nộp
          const submittedQuizRoomResults = examData.data.filter(
            (result: QuizRoomResult) => result.stats.totalQuestions > 0
          );
          setQuizRoomResults([...examQuizzes, ...submittedQuizRoomResults]);
        } else {
          setQuizRoomResults(examQuizzes);
        }
      }
    } catch (err) {
      setError("Error fetching history");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchQuizHistory();
    }
  }, [userId, getToken]);

  const modalPlay = (quiz: Partial<Quiz>) => {
    setIsModalOpen(true);
    setSelectedQuiz(quiz as Quiz);
  };

  const handleExamClick = async (result: any) => {
    try {
      const token = await getToken();
      const response = await fetch(
        `http://localhost:5000/api/submission/participant/${result.participationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();

      if (data.success) {
        setSelectedExamResult({
          ...result,
          submissions: data.submissions,
        });
        setIsExamDetailModalOpen(true);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-orange border-t-transparent rounded-full animate-spin mb-4"></div>
          <div className="text-xl">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-littleblue text-background flex items-center justify-center">
        <div className="text-xl text-red-500 p-6 bg-black/30 backdrop-blur-sm rounded-lg shadow-lg">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <h1 className="text-2xl mb-10 mt-16">Hoạt động của bạn</h1>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("practice")}
          className={`flex items-center font-semibold gap-2 px-6 py-3 border-1 rounded-xl transition-all ${
            activeTab === "practice"
              ? "bg-orange text-darkblue border-orange"
              : "bg-background text-darkblue border-gray-200 "
          }`}
        >
          <HugeiconsIcon icon={BookOpenIcon} size={20} />
          <span>Luyện tập</span>
        </button>
        <button
          onClick={() => setActiveTab("exam")}
          className={`flex items-center font-semibold gap-2 px-6 py-3 border-1 rounded-xl transition-all ${
            activeTab === "exam"
              ? "bg-orange text-darkblue border-orange"
              : "bg-background text-darkblue border-gray-200 "
          }`}
        >
          {/* <HugeiconsIcon icon={GraduationCapIcon} size={20} /> */}
          <span>Bài thi</span>
        </button>
      </div>

      {/* Practice Results */}
      {activeTab === "practice" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizPracticeResults.map((history) => (
            <div
              key={history.participationId}
              className="bg-white box-shadow hover:shadow-xl transition-all duration-300 cursor-pointer quizcard_component rounded-xl w-full"
            >
              <div className="noise  rounded-2xl"></div>
              <div className="relative quizcard_component">
                <img
                  src={
                    history.quiz.imageUrl || "/assets/default-quiz-cover.jpg"
                  }
                  alt={history.quiz.name}
                  className="w-full h-64 object-cover rounded-t-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>

                <div className="absolute top-4 right-4">
                  <p
                    className={`py-1 px-4 text-sm text-white font-semibold rounded-full ${
                      history.quiz.difficulty === "easy"
                        ? "bg-green-500"
                        : history.quiz.difficulty === "medium"
                        ? "bg-orange"
                        : "bg-red-wine"
                    }`}
                  >
                    {history.quiz.difficulty === "easy"
                      ? "Dễ"
                      : history.quiz.difficulty === "medium"
                      ? "Trung bình"
                      : "Khó"}
                  </p>
                </div>

                <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white">
                  {history.quiz.name}
                </h3>
              </div>

              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon
                      icon={HelpSquareIcon}
                      size={20}
                      color="#FF5733"
                    />
                    <span className="font-medium">
                      {history.stats.totalQuestions} câu hỏi
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Điểm số cao nhất</p>
                    <p className="font-bold text-lg">{history.score}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Tỷ lệ đúng</span>
                    <span>{history.stats.correctPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange h-2 rounded-full"
                      style={{ width: `${history.stats.correctPercentage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-between text-sm text-gray-500 mb-4">
                  <span>
                    Tham gia: {format(new Date(history.joinedAt), "dd/MM/yyyy")}
                  </span>
                  <span>
                    {history.stats.correctAnswers}/
                    {history.stats.totalQuestions} câu đúng
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-gray-300 btn-hover w-1/3"
                    onClick={() => modalPlay(history.quiz)}
                  >
                    <span className="font-medium">Chi tiết</span>
                  </button>

                  <NavLink
                    to={`/join-quiz/${history.quiz._id}`}
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-orange btn-hover w-2/3"
                  >
                    <span className="text-darkblue font-bold">Chơi lại</span>
                    <HugeiconsIcon icon={PlayIcon} size={20} color="#0A0A3F" />
                  </NavLink>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Exam Results */}
      {activeTab === "exam" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizRoomResults.map((result) => (
            <div
              key={result.participationId}
              onClick={() => handleExamClick(result)}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange/50 transition-all duration-300 cursor-pointer"
            >
              {/* Quiz Room Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-orange mb-2">
                    {result.quizRoom.quiz.name}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="px-2 py-1 bg-gray-700/50 rounded-full">
                      {result.quizRoom.quiz.topic}
                    </span>
                    <span className="px-2 py-1 bg-gray-700/50 rounded-full">
                      {result.quizRoom.quiz.difficulty}
                    </span>
                    <span className="px-2 py-1 bg-gray-700/50 rounded-full">
                      Mã phòng: {result.quizRoom.roomCode}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange">
                    {result.score}/{result.stats.totalQuestions}
                  </div>
                  <div className="text-sm text-gray-400">
                    {new Date(result.joinedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                    <span>Đúng</span>
                  </div>
                  <div className="text-lg font-semibold text-green-400">
                    {result.stats.correctAnswers}
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                    <HugeiconsIcon icon={Cancel01Icon} size={16} />
                    <span>Sai</span>
                  </div>
                  <div className="text-lg font-semibold text-red-400">
                    {result.stats.incorrectAnswers}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                  <span>Tỷ lệ đúng</span>
                  <span>{result.stats.correctPercentage}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange to-red-500 transition-all duration-500"
                    style={{ width: `${result.stats.correctPercentage}%` }}
                  />
                </div>
              </div>

              {/* Additional Info */}
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={ClockIcon} size={16} />
                  <span>
                    {Math.floor(result.stats.timeSpent / 60)} phút{" "}
                    {result.stats.timeSpent % 60} giây
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <HugeiconsIcon icon={Chart02Icon} size={16} />
                  <span>Thời gian: {result.quizRoom.durationMinutes} phút</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedQuiz && (
        <QuizDetailModal
          quiz={selectedQuiz}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {isExamDetailModalOpen && selectedExamResult && (
        <ExamResultDetailModal
          isOpen={isExamDetailModalOpen}
          onClose={() => {
            setIsExamDetailModalOpen(false);
            setSelectedExamResult(null);
          }}
          result={selectedExamResult}
        />
      )}
    </div>
  );
}
