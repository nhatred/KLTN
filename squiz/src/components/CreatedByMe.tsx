import { useEffect, useState } from "react";
import { Quiz } from "../types/Quiz";
import { NavLink } from "react-router";
import { useUser } from "@clerk/clerk-react";
import QuizzCard from "./QuizzCard";
import SpinnerLoading from "../components/SpinnerLoading";

export default function CreatedByMe() {
  const { user } = useUser();
  const [quizs, setQuizs] = useState<Quiz[]>([]);
  const [filter, setFilter] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(true);

  // Fetch quizzes
  const fetchUserQuizzes = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/quiz/user/${user?.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user quizzes");
      }

      const quizzes = await response.json();
      setQuizs(quizzes);
    } catch (error) {
      console.error("Error fetching user quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserQuizzes();
    }
  }, [user]);

  // Filter quizzes by public/private
  const filteredQuizzes = quizs.filter((quiz: Quiz) =>
    filter === "public" ? quiz.isPublic === true : quiz.isPublic === false
  );

  // Update total count of regular quizzes (excluding exams)
  // Calculate counts for public and private quizzes
  const publicQuizCount = quizs.filter((quiz) => quiz.isPublic === true).length;
  const privateQuizCount = quizs.filter(
    (quiz) => quiz.isPublic === false
  ).length;

  return (
    <div>
      <div className="mb-8 flex gap-5 col-span-4">
        <button
          onClick={() => setFilter("public")}
          className={`border-b-2 font-semibold text-darkblue ${
            filter === "public"
              ? "border-darkblue"
              : "border-background text-dim"
          }`}
        >
          Công khai ({publicQuizCount})
        </button>
        <button
          onClick={() => setFilter("private")}
          className={`border-b-2 font-semibold text-darkblue ${
            filter === "private"
              ? "border-darkblue"
              : "border-background text-dim"
          }`}
        >
          Riêng tư ({privateQuizCount})
        </button>
      </div>
      {loading ? (
        <div className="h-80 flex justify-center items-end">
          <SpinnerLoading />
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz: Quiz) => (
              <NavLink to={"/edit-quiz/" + quiz._id} key={quiz._id}>
                <QuizzCard
                  key={quiz._id}
                  quiz={quiz}
                  handleCardClick={() => {}}
                  onQuizDeleted={fetchUserQuizzes}
                />
              </NavLink>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-400">
              <img
                src="/assets/activity2_empty.png"
                alt="empty-quiz"
                className="w-60 mx-auto"
              />
              <p className="mt-2 text-xl font-semibold">
                {filter === "public"
                  ? "Không có bài quiz công khai nào được tạo bởi bạn"
                  : "Không có bài quiz riêng tư nào được tạo bởi bạn"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
