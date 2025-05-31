import { useEffect, useState } from "react";
import { Quiz } from "../types/Quiz";
import { NavLink } from "react-router";
import { useUser } from "@clerk/clerk-react";
import QuizzCard from "./QuizzCard";
import SpinnerLoading from "./SpinnerLoading";
import axios from "axios";

export default function ExamCreatedByMe() {
  const { user } = useUser();
  const [quizs, setQuizs] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"public" | "private">("public");

  useEffect(() => {
    const fetchUserExams = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/quiz/user-exams/${user?.id}`);

        if (response.data.success) {
          setQuizs(response.data.data);
        } else {
          console.error("Failed to fetch user exams:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching user exams:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchUserExams();
    }
  }, [user]);

  // Filter quizzes by public/private
  const filteredExams = quizs.filter((quiz: Quiz) =>
    filter === "public" ? quiz.isPublic === true : quiz.isPublic === false
  );

  // Calculate counts for public and private quizzes
  const publicExamCount = quizs.filter((quiz) => quiz.isPublic === true).length;
  const privateExamCount = quizs.filter(
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
          Công khai ({publicExamCount})
        </button>
        <button
          onClick={() => setFilter("private")}
          className={`border-b-2 font-semibold text-darkblue ${
            filter === "private"
              ? "border-darkblue"
              : "border-background text-dim"
          }`}
        >
          Riêng tư ({privateExamCount})
        </button>
      </div>
      {loading ? (
        <div className="h-80 flex justify-center items-end">
          <SpinnerLoading />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.length > 0 ? (
            filteredExams.map((quiz: Quiz) => (
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
                Không có đề thi nào được tạo bởi bạn
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
