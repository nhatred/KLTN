import { useState, useEffect } from "react";
import QuizzCard from "../components/QuizzCard";
import { Quiz } from "../types/Quiz";
import "../style/quizcard.css";
import "../style/dashboard.css";
import { useUser } from "@clerk/clerk-react";
import { NavLink } from "react-router";
import QuizDetailModal from "../components/QuizDetailModal";

const API_BASE_URL = "http://localhost:5000/api";

export default function Dashboard() {
  const [quizs, setQuizs] = useState([]);
  const [recentQuizzes, setRecentQuizzes] = useState<Quiz[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { user } = useUser();

  const modalPlay = (quiz: Quiz) => { 
    console.log("Quiz clicked:", quiz);
    setIsModalOpen(true);
    setSelectedQuiz(quiz);
    console.log(user)
  }

  useEffect(() => {
    console.log(selectedQuiz)
  }, [isModalOpen]);

  const fetchAllQuiz = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/quiz/`);

      if (!response.ok) throw new Error("Failed to fetch quizzes");

      const quizzes = await response.json();
      setQuizs(quizzes);
    } catch (error) {
      console.error("error fetching quizzes: ", error);
    }
  };

  const fetchRecentQuizzes = async () => {
    if (!user?.id) {
      console.log("No user ID available");
      return;
    }
    
    try {
      console.log(`Fetching quiz history for user: ${user.id}`);
      const response = await fetch(`${API_BASE_URL}/quiz/history/${user.id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch recent quizzes");
      }
      
      const data = await response.json();
      console.log("Received quiz history data:", data);
      
      if (data.success && data.data) {
        // Lấy danh sách quiz từ lịch sử tham gia
        const quizzes = data.data.map((history: any) => history.quiz as Quiz);
        console.log("Processed quizzes:", quizzes);
        
        // Loại bỏ các quiz trùng lặp và giới hạn 6 quiz gần nhất
        const uniqueQuizzes = Array.from(
          new Map(quizzes.map((quiz: Quiz) => [quiz._id, quiz])).values()
        ).slice(0, 6) as Quiz[];
        
        console.log("Final unique quizzes:", uniqueQuizzes);
        setRecentQuizzes(uniqueQuizzes);
      } else {
        console.log("No quiz history data found");
        setRecentQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching recent quizzes:", error);
      setRecentQuizzes([]);
    }
  };

  useEffect(() => {
    fetchAllQuiz();
    if (user?.id) {
      fetchRecentQuizzes();
    }
  }, [user?.id]);

  const filteredQuizzes = quizs.filter(
    (quiz: any) => quiz.isPublic === "public"
  );

  return (
    <div className="pt-16">
      <div className="grid h-40 grid-cols-3 gap-5 mt-10 mb-32">
        <div className="empower_component w-full box-shadow col-span-2 py-16 rounded-xl ">
          <div className="flex  flex-col justify-center  items-center">
            <div className="w-2/3 z-10 bg-background grid grid-cols-6 justify-between gap-2 border-gray-300 border-1 rounded-xl p-2">
              <input
                className="px-1 font-semibold py-3 text-xl col-span-4"
                type="text"
                placeholder="Nhập mã tham gia"
              />
              <button className=" py-1 px-4 col-span-2 text-lg font-bold rounded-xl bg-darkblue text-background btn-hover transition-all duration-500">
                Tham gia
              </button>
            </div>
            <div className="grain"></div>
            <div className="noise"></div>
          </div>
        </div>
        <div className="flex items-center relative empower_component w-full box-shadow ">
          <div className="text-2xl tracking-wide font-bold ml-2">
            <h1>Xin chào, tôi là Squizz <br />Hãy tham gia cùng tôi nào!</h1>
          </div>

          <img
            className="h-40 absolute right-0 bottom-0"
            src="\assets\squizz.png"
            alt=""
          />
          <div className="grain"></div>
          <div className="noise"></div>
        </div>
      </div>
      
      <div className="mb-20">
        <div className="flex justify-between mb-5">
          <h1 className="text-2xl mb-5">Hoạt động gần đây</h1>
          <NavLink to="/dashboard/my-quiz/hosted-quizzes" className="flex items-center justify-center cursor-pointer h-10 bg-darkblue btn-hover text-background font-semibold rounded-full">
            <p className="px-5 py-1">Xem thêm</p>
          </NavLink>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {recentQuizzes.length > 0 ? (
            recentQuizzes.map((quiz: Quiz) => (
              <QuizzCard key={quiz._id} quiz={quiz} handleCardClick={() => modalPlay(quiz)} />
            ))
          ) : (
            <p className="col-span-4 text-center text-gray-500">Chưa có hoạt động nào gần đây</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex justify-between mb-5">
          <h1 className="text-2xl mb-5">Các Squizz</h1>
          <div className="flex items-center justify-center cursor-pointer h-10 bg-darkblue btn-hover text-background font-semibold rounded-full">
            <p className="px-5 py-1">Xem thêm</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5">
          {filteredQuizzes.map((quiz: Quiz) => (
            <QuizzCard key={quiz._id} quiz={quiz} handleCardClick={() => modalPlay(quiz)} />
          ))}
        </div>
      </div>
      {isModalOpen && selectedQuiz && (
        <QuizDetailModal quiz={selectedQuiz} onClose={() => setIsModalOpen(false)} />
      )}
      
    </div>
  );
}
