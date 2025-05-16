import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Quiz } from "../types/Quiz";
import QuizDetailModal from "../components/QuizDetailModal";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlayIcon, HelpSquareIcon } from "@hugeicons/core-free-icons";
import { NavLink } from "react-router";
import "../style/quizcard.css";
import Loading from "../components/Loading";

const API_BASE_URL = "http://localhost:5000/api";

interface QuizHistory {
  participationId: string;
  quiz: Quiz;
  score: number;
  joinedAt: string;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: number;
  };
}

export default function Activity() {
  const { user } = useUser();
  const [quizHistory, setQuizHistory] = useState<QuizHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuizHistory = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/quiz/history/${user.id}`);
      
      if (!response.ok) throw new Error("Failed to fetch quiz history");
      
      const data = await response.json();
      if (data.success && data.data) {
        const highestScores = new Map<string, QuizHistory>();
        data.data.forEach((history: QuizHistory) => {
          const quizId = history.quiz._id;
          const existingHistory = highestScores.get(quizId);

          if (!existingHistory || history.score > existingHistory.score) {
            highestScores.set(quizId, history);
          }
        });
        
        const uniqueHistory = Array.from(highestScores.values())
          .sort((a, b) => new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime());
        
        setQuizHistory(uniqueHistory);
      }
    } catch (error) {
      console.error("Error fetching quiz history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchQuizHistory();
    }
  }, [user?.id]);

  const modalPlay = (quiz: Quiz) => {
    setIsModalOpen(true);
    setSelectedQuiz(quiz);
  };

  if (loading) {
    return (
      <Loading />
    );
  }

  return (
    <div className="pt-16 px-4 md:px-8 ">
      <h1 className="text-2xl mb-10 mt-16">Hoạt động của bạn</h1>
      
      {quizHistory.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Bạn chưa tham gia quiz nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizHistory.map((history) => (
            <div 
              key={history.participationId}
              className="bg-white box-shadow hover:shadow-xl transition-all duration-300 cursor-pointer quizcard_component rounded-xl w-full"
            >
             
              <div className="noise  rounded-2xl"></div>
              <div className="relative quizcard_component">
                <img 
                  src={history.quiz.imageUrl || "/assets/default-quiz-cover.jpg"} 
                  alt={history.quiz.name}
                  className="w-full h-64 object-cover rounded-t-xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                
                <div className="absolute top-4 right-4">
                  <p className={`py-1 px-4 text-sm text-white font-semibold rounded-full ${
                    history.quiz.difficulty === "easy" ? "bg-green-500" :
                    history.quiz.difficulty === "medium" ? "bg-orange" :
                    "bg-red-wine"
                  }`}>
                    {history.quiz.difficulty === "easy" ? "Dễ" :
                    history.quiz.difficulty === "medium" ? "Trung bình" :
                    "Khó"}
                  </p>
                </div>
                
                <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white">
                  {history.quiz.name}
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <HugeiconsIcon icon={HelpSquareIcon} size={20} color="#FF5733" />
                    <span className="font-medium">{history.stats.totalQuestions} câu hỏi</span>
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
                  <span>Tham gia: {format(new Date(history.joinedAt), "dd/MM/yyyy")}</span>
                  <span>{history.stats.correctAnswers}/{history.stats.totalQuestions} câu đúng</span>
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
      
      {isModalOpen && selectedQuiz && (
        <QuizDetailModal 
          quiz={selectedQuiz} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
