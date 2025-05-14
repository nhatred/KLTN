// import { format } from "date-fns";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  Bookmark02Icon,
  HelpSquareIcon,
} from "@hugeicons/core-free-icons";
import "../style/quizcard.css";
import "../style/dashboard.css";
import { Quiz } from "../types/Quiz";

interface QuizzCardProps {
  quiz: Quiz;
  handleCardClick: () => void;
}

export default function QuizzCard({ quiz, handleCardClick }: QuizzCardProps) {
  return (
    <div
      onClick={handleCardClick}
      className="bg-white box-shadow flex flex-col quizcard_component justify-between rounded overflow-hidden"
    >
      <div className="relative quizcard_component">
        <img className="w-screen rounded-t-2xl h-52 object-cover" src={quiz.imageUrl} alt="" />
        <div className="grain rounded-2xl"></div>
        <div className="noise rounded-2xl"></div>
      </div>
      <div className="p-5 ">
        <div className="flex justify-between items-start gap-2">
          <p className="text-lg font-semibold  line-clamp-2 ">{quiz.name}</p>
          <p
            className={`py-1 px-3 text-sm text-background font-semibold rounded-full
                      ${
                        quiz.difficulty == "easy"
                          ? "bg-darkblue"
                          : quiz.difficulty === "medium"
                          ? "bg-darkblue"
                          : "bg-darkblue"
                      }`}
          >
            {quiz.difficulty}
          </p>
        </div>
        <div className="flex gap-2 justify-between items-start mt-2">
          <div className="flex gap-2">
            <div className="flex gap-1 items-center">
              <HugeiconsIcon icon={HelpSquareIcon} size={20} />
              <p className="text-sm">{quiz.questions.length} câu hỏi</p>
            </div>
            <div className="flex gap-1 items-center">
              <HugeiconsIcon icon={Bookmark02Icon} size={18} />
              <p className="text-sm">{quiz.topic}</p>
            </div>
          </div>

          {/* <div>
            <p className="text-xs">
              {format(new Date(quiz.createdAt), "dd-MM-yyyy")}
            </p>
          </div> */}
        </div>
        <div className="grain  rounded-2xl"></div>
        <div className="noise  rounded-2xl"></div>
      </div>

      <div className="flex px-5 pb-5 justify-between mt-10 items-center">
        <p className="text-sm font-bold">{quiz.totalPlays} người đã chơi</p>
        <div className="h-10 w-10 flex justify-center items-center rounded-full bg-darkblue">
          <HugeiconsIcon icon={PlayIcon} color="background" />
        </div>
      </div>
    </div>
  );
}
