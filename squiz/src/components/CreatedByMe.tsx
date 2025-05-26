import { useEffect, useState } from "react";
import { Quiz } from "../types/Quiz";
import { NavLink, useOutletContext } from "react-router";
import { useUser } from "@clerk/clerk-react";
import QuizzCard from "./QuizzCard";
import SpinnerLoading from "../components/SpinnerLoading";

export default function CreatedByMe() {
  const { user } = useUser();
  const { setCreatedByMeCount } = useOutletContext<{
    setCreatedByMeCount: (count: number) => void;
  }>();
  const [quizs, setQuizs] = useState([]);
  const [filter, setFilter] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
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
        setCreatedByMeCount(quizzes.length);
      } catch (error) {
        console.error("Error fetching user quizzes:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserQuizzes();
    }
  }, [user, setCreatedByMeCount]);

  const filteredQuizzes = quizs.filter((quiz: any) =>
    filter === "public"
      ? quiz.isPublic === "public"
      : quiz.isPublic === "private"
  );
  return (
    <div>
      <div className="mb-8 flex gap-5 col-span-4">
        <button
          onClick={() => setFilter("public")}
          className={`border-b-2 font-semibold text-darkblue  ${
            filter === "public"
              ? "border-darkblue "
              : "border-background text-dim"
          }`}
        >
          Công khai
        </button>
        <button
          onClick={() => setFilter("private")}
          className={`border-b-2 font-semibold text-darkblue ${
            filter === "private"
              ? "border-darkblue "
              : "border-background text-dim"
          }`}
        >
          Riêng tư
        </button>
      </div>
      {loading ? (
        <div className="h-80 flex justify-center items-end">
          <SpinnerLoading />
        </div>
      ) : (
        <div className=" grid grid-cols-3 gap-5">
          {filteredQuizzes.length > 0 ? (
            filteredQuizzes.map((quiz: Quiz) => (
              <NavLink to={"/edit-quiz/" + quiz._id} key={quiz._id}>
                <QuizzCard
                  key={quiz._id}
                  quiz={quiz}
                  handleCardClick={() => {}}
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
                Không có bài quiz nào được tạo bởi bạn
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
