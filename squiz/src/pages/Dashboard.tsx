import { useState } from "react";
import QuizzCard from "../components/QuizzCard";
import { Quiz } from "../types/Quiz";
import "../style/dashboard.css";
export default function Dashboard() {
  const [quizs, setQuizs] = useState([]);
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
          <h1 className="text-2xl tracking-wide font-bold ml-2">
            Xin chào, tôi là Squizz <br />
            <h1>Hãy tham gia cùng tôi nào!</h1>
          </h1>

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
            <QuizzCard key={quiz._id} quiz={quiz} />
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
            <QuizzCard key={quiz._id} quiz={quiz} />
          ))}
        </div>
      </div>
    </div>
  );
}
