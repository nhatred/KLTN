import { useState } from "react";
import { NavLink, Outlet } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  EditUser02Icon,
  Clock02Icon,
  InLoveIcon,
} from "@hugeicons/core-free-icons";
import { useQuiz } from "../contexts/QuizContext";
import { useAuth } from "@clerk/clerk-react";
async function getToken() {
  const { getToken } = useAuth();
  const token = await getToken();
  console.log(token);
}

export default function MyQuiz() {
  getToken();
  const { quizHistory } = useQuiz();
  const [createdByMeCount, setCreatedByMeCount] = useState(0);
  return (
    <div className="pt-32 grid grid-cols-5 items-start gap-y-5 gap-x-10">
      <div className=" col-span-1">
        <h1 className="text-2xl mb-5">Quiz của tôi</h1>

        <div className="relative bg-background  col-span-1 self-start box-shadow p-5">
          <div className="flex flex-col justify-between">
            <NavLink
              to="/dashboard/my-quiz/created-by-me"
              className={({ isActive }) =>
                ` cursor-pointer py-3 flex justify-between gap-2 ${
                  isActive
                    ? "border-b border-b-darkblue text-darkblue font-black"
                    : "border-b border-b-slate-300 text-dim"
                }`
              }
            >
              <div className="flex gap-2 items-center">
                <HugeiconsIcon icon={EditUser02Icon} />
                <p className="font-semibold">Được tạo bởi tôi</p>
              </div>
              <p className="font-semibold">{createdByMeCount}</p>
            </NavLink>

            <NavLink
              to="/dashboard/my-quiz/hosted-quizzes"
              className={({ isActive }) =>
                ` cursor-pointer py-3 flex justify-between gap-2 ${
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
              <p className="font-semibold">{quizHistory.length}</p>
            </NavLink>

            <NavLink
              to="/dashboard/my-quiz/liked-quizzes"
              className={({ isActive }) =>
                ` cursor-pointer py-3 flex justify-between gap-2 ${
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
          </div>
          <div className="grain"></div>
          <div className="noise"></div>
        </div>
      </div>
      <div className="col-span-4 self-start">
        <Outlet context={{ setCreatedByMeCount }} />
      </div>
    </div>
  );
}
