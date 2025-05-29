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
  ChampionIcon,
  Calendar03Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { NavLink } from "react-router";
import "../style/quizcard.css";
import SpinnerLoading from "../components/SpinnerLoading";

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
    return <SpinnerLoading />;
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
          {quizPracticeResults.length > 0 ? (
            quizPracticeResults.map((history) => (
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
                      Tham gia:{" "}
                      {format(new Date(history.joinedAt), "dd/MM/yyyy")}
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
                      <HugeiconsIcon
                        icon={PlayIcon}
                        size={20}
                        color="#0A0A3F"
                      />
                    </NavLink>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400">
              <img
                src="/assets/activity_empty.png"
                alt="empty-quiz"
                className="w-60 mx-auto"
              />
              <p className="mt-2 text-xl font-semibold">
                Không có kết quả luyện tập nào
              </p>
            </div>
          )}
        </div>
      )}

      {/* Exam Results */}
      {activeTab === "exam" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizRoomResults.length > 0 ? (
            quizRoomResults.map((result) => (
              <div style={{ backgroundColor: "#fcfbfa" }}>
                <div
                  key={result.participationId}
                  onClick={() => handleExamClick(result)}
                  className="group relative bg-white rounded-2xl p-5 border border-gray-200 hover:border-red-300 transition-all duration-300 cursor-pointer hover:shadow-xl hover:shadow-red-100/50 hover:-translate-y-1"
                >
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <HugeiconsIcon
                            icon={ChampionIcon}
                            size={18}
                            className="text-orange"
                          />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-orange transition-colors duration-300">
                          {result.quizRoom.quiz.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                          <HugeiconsIcon
                            icon={BookOpenIcon}
                            size={14}
                            className="inline mr-1"
                          />
                          {result.quizRoom.quiz.topic}
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-lg text-sm font-semibold border`}
                        >
                          {result.quizRoom.quiz.difficulty}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-1`}>
                        {result.score}
                        <span className="text-gray-400 text-xl">
                          /{result.stats.totalQuestions}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <HugeiconsIcon icon={Calendar03Icon} size={14} />
                        <span>
                          {new Date(result.joinedAt).toLocaleDateString(
                            "vi-VN"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 group-hover:bg-green-100/50 transition-all duration-300">
                      <div className="flex items-center gap-2 text-sm text-green-700 mb-2 font-medium">
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                        <span>Đúng</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {result.stats.correctAnswers}
                      </div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 group-hover:bg-red-100/50 transition-all duration-300">
                      <div className="flex items-center gap-2 text-sm text-red-700 mb-2 font-medium">
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
                        <span>Sai</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">
                        {result.stats.incorrectAnswers}
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-gray-600">
                        Tỷ lệ đúng
                      </span>
                      <span className={`text-lg font-bold`}>
                        {result.stats.correctPercentage}%
                      </span>
                    </div>

                    <div className="relative">
                      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                          className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-1000 ease-out rounded-full relative"
                          style={{
                            width: `${result.stats.correctPercentage}%`,
                          }}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full" />
                        </div>
                      </div>

                      {/* Progress indicator */}
                      {result.stats.correctPercentage > 5 && (
                        <div
                          className="absolute -top-1 w-1 h-5 bg-orange rounded-full shadow-md transition-all duration-1000"
                          style={{
                            left: `${result.stats.correctPercentage}%`,
                            transform: "translateX(-50%)",
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <HugeiconsIcon
                          icon={Clock01Icon}
                          size={12}
                          className="text-blue-600"
                        />
                      </div>
                      <span className="font-medium">
                        Hoàn thành: {Math.floor(result.stats.timeSpent / 60)}{" "}
                        phút {result.stats.timeSpent % 60} giây
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <HugeiconsIcon
                          icon={Chart02Icon}
                          size={12}
                          className="text-purple-600"
                        />
                      </div>
                      <span className="font-medium">
                        Thời hạn: {result.quizRoom.durationMinutes} phút
                      </span>
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-red-50/0 to-red-50/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400">
              <img
                src="/assets/activity_empty.png"
                alt="empty-quiz"
                className="w-60 mx-auto"
              />
              <p className="mt-2 text-xl font-semibold">
                Không có kết quả bài thi nào
              </p>
            </div>
          )}
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
