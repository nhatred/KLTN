import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EditUser02Icon,
  Clock02Icon,
  InLoveIcon,
  BookUploadIcon,
} from "@hugeicons/core-free-icons";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";

export default function MyQuiz() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [quizCount, setQuizCount] = useState(0);
  const [examCount, setExamCount] = useState(0);
  const [quizHistoryCount, setQuizHistoryCount] = useState(0);

  const fetchUserQuizzes = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/quiz/user/${user?.id}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch user quizzes");
      }

      const quizzes = await response.json();
      setQuizCount(quizzes.length);
    } catch (error) {
      console.error("Error fetching user quizzes:", error);
    }
  };

  const fetchUserExams = async () => {
    try {
      const response = await axios.get(`/api/quiz/user-exams/${user?.id}`);

      if (response.data.success) {
        setExamCount(response.data.data.length);
      } else {
        console.error("Failed to fetch user exams:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching user exams:", error);
    }
  };

  const fetchQuizHistory = async () => {
    try {
      const token = await getToken();

      // Fetch quiz practice history
      const practiceResponse = await fetch(
        `http://localhost:5000/api/quiz/history/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const practiceData = await practiceResponse.json();

      // Fetch quiz room history
      const examResponse = await fetch(
        `http://localhost:5000/api/quizRoom/history/${user?.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const examData = await examResponse.json();

      setQuizHistoryCount(practiceData.data.length + examData.data.length);
      console.log(practiceData.data.length, examData.data.length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserQuizzes();
      fetchUserExams();
      fetchQuizHistory();
    }
  }, [user]);

  return (
    <div className="pt-32 grid grid-cols-5 items-start gap-y-5 gap-x-10">
      <div className="col-span-1">
        <h1 className="text-2xl mb-5">Quiz của tôi</h1>

        <div className="relative bg-background col-span-1 self-start box-shadow p-5">
          <div className="flex flex-col justify-between">
            <NavLink
              to="/dashboard/my-quiz/created-by-me"
              className={({ isActive }) =>
                `cursor-pointer py-3 flex justify-between gap-2 ${
                  isActive
                    ? "border-b border-b-darkblue text-darkblue font-black"
                    : "border-b border-b-slate-300 text-dim"
                }`
              }
            >
              <div className="flex gap-2 items-center">
                <HugeiconsIcon icon={EditUser02Icon} />
                <p className="font-semibold">Quiz của tôi</p>
              </div>
              <p className="font-semibold">{quizCount}</p>
            </NavLink>

            <NavLink
              to="/dashboard/my-quiz/hosted-quizzes"
              className={({ isActive }) =>
                `cursor-pointer py-3 flex justify-between gap-2 ${
                  isActive
                    ? "border-b border-b-darkblue text-darkblue font-black"
                    : "border-b border-b-slate-300 text-dim"
                }`
              }
            >
              <div className="flex gap-2 items-center">
                <HugeiconsIcon icon={Clock02Icon} />
                <p className="font-semibold">Trước đây đã sử dụng</p>
              </div>
              <p className="font-semibold">{quizHistoryCount}</p>
            </NavLink>

            <NavLink
              to="/dashboard/my-quiz/liked-quizzes"
              className={({ isActive }) =>
                `cursor-pointer py-3 flex justify-between gap-2 ${
                  isActive
                    ? "border-b border-b-darkblue text-darkblue font-black"
                    : "border-b border-b-slate-300 text-dim"
                }`
              }
            >
              <div className="flex gap-2 items-center">
                <HugeiconsIcon icon={InLoveIcon} />
                <p className="font-semibold">Được tôi yêu thích</p>
              </div>
              <p className="font-semibold">0</p>
            </NavLink>

            <NavLink
              to="/dashboard/my-quiz/exam-created-by-me"
              className={({ isActive }) =>
                `cursor-pointer py-3 flex justify-between gap-2 ${
                  isActive
                    ? "border-b border-b-darkblue text-darkblue font-black"
                    : "border-b border-b-slate-300 text-dim"
                }`
              }
            >
              <div className="flex gap-2 items-center">
                <HugeiconsIcon icon={BookUploadIcon} />
                <p className="font-semibold">Đề thi của tôi</p>
              </div>
              <p className="font-semibold">{examCount}</p>
            </NavLink>
          </div>
          <div className="grain"></div>
          <div className="noise"></div>
        </div>
      </div>
      <div className="col-span-4 self-start">
        <Outlet />
      </div>
    </div>
  );
}
