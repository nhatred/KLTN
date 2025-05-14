import { useState, useEffect } from "react";
import QuizzCard from "../components/QuizzCard";
import { Quiz } from "../types/Quiz";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  Bookmark02Icon,
  HelpSquareIcon,
  Share08Icon
} from "@hugeicons/core-free-icons";
import "../style/quizcard.css";
import "../style/dashboard.css";
import { format } from "date-fns";
import { useUser } from "@clerk/clerk-react";
import { NavLink } from "react-router";

export default function Dashboard() {
  const [quizs, setQuizs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const { user } = useUser();
  
  const formatPlayCount = (count: number) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  };

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
      const response = await fetch("http://localhost:5000/api/quiz/");

      if (!response.ok) throw new Error("Failed to fetch quizzes");

      const quizzes = await response.json();
      setQuizs(quizzes);
    } catch (error) {
      console.error("error fetching quizzes: ", error);
    }
  };
  const filteredQuizzes = quizs.filter(
    (quiz: any) => quiz.isPublic === "public"
  );
  fetchAllQuiz();

  return (
    <div className=" pt-16">
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
      <div className="mb-16">
        <div className="flex justify-between mb-5">
          <h1 className="text-2xl mb-5">Hoạt động gần đây</h1>
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
      <div>
        <div className="flex justify-between  mb-5">
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

      {/* Modal Play */}
      {isModalOpen && (
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-65">
           <div onClick={(e) => e.stopPropagation()}
      className="bg-background container mx-auto w-2/5 box-shadow flex flex-col quizcard_component justify-between rounded overflow-hidden"
    >
      <div className="relative quizcard_component">
        <img className="w-screen rounded-t-2xl object-cover" src={selectedQuiz?.imageUrl} alt="" />
        <div className="grain-quiz rounded-2xl"></div>
              <div className="noise-quiz rounded-2xl"></div>
             
      </div>
      <div className="p-5 ">
        <div className="flex justify-between items-start gap-2">
          <p className="text-lg font-semibold  line-clamp-2 ">{selectedQuiz?.name}</p>
          <p
            className={`py-1 px-3 text-sm text-background font-semibold rounded-full bg-darkblue`}
          >
            {selectedQuiz?.difficulty}
          </p>
        </div>
        <div className="flex gap-2 justify-between items-start mt-2">
          <div className="flex justify-between w-full">
              <div className="flex gap-2">
                    <div className="flex gap-1 items-center">
                      <HugeiconsIcon icon={HelpSquareIcon} size={20} color="red" />
                      <p className="font-semibold">{selectedQuiz?.questions.length} câu hỏi</p>
                    </div>
                    <div className="flex gap-1 items-center">
                      <HugeiconsIcon icon={Bookmark02Icon} size={18} color="blue" />
                      <p className="font-semibold">{selectedQuiz?.topic}</p>
                    </div>
              </div>
              <p className="font-semibold">
              Ngày đăng: {selectedQuiz?.createdAt ? format(new Date(selectedQuiz.createdAt), "dd-MM-yyyy") : ''}
            </p>
            
          </div>
          </div>
              <div className="flex gap-2 items-center mt-5">
                <img src={user?.imageUrl} alt="" className="w-10 h-10 rounded-full" />
                <div>
                <p className="text-lg font-semibold">{user?.fullName}</p>
                      </div>
              </div>
          <div>
        </div>
              
        <div className="grain-quiz rounded-2xl"></div>
        <div className="noise-quiz rounded-2xl"></div>
      </div>

      <div className="flex px-5 pb-5 justify-between mt-10 items-center">
              <p className=" font-bold">{formatPlayCount(selectedQuiz?.totalPlays || 0)} lần chơi</p>
              <div className="flex items-center gap-2">
                <div className=" flex items-center gap-2 btn-hover cursor-pointer p-5 rounded-lg" >
                  <p>Chia sẻ</p>
                <HugeiconsIcon icon={Share08Icon} size={28} />
              </div>
        <NavLink to={`/join-quiz/${selectedQuiz?._id}`} className="flex px-5 py-3 justify-center items-center rounded-lg bg-orange btn-hover cursor-pointer ">
          <p className="text-darkblue font-semibold">Chơi ngay</p>
                <HugeiconsIcon icon={PlayIcon} size={36} color="black" />
        </NavLink>
               </div>
      </div>
          </div>
        </div>
      )}
    </div>
  );
}
