// import { format } from "date-fns";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  Bookmark02Icon,
  HelpSquareIcon,
  UserGroup03Icon,
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
      className=" box-shadow flex flex-col quizcard_component justify-between rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <div className="grain  rounded-2xl"></div>
      <div className="noise  rounded-2xl"></div>
      <div className="relative quizcard_component">
        <img 
          className="w-screen h-56 object-cover rounded-t-xl" 
          src={quiz.imageUrl || "/assets/default-quiz-cover.jpg"} 
          alt={quiz.name} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-t-xl"></div>
        <div className="grain rounded-t-xl"></div>
        <div className="noise rounded-t-xl"></div>
        
        <div className="absolute top-4 right-4">
          <p className={`py-1 px-4 text-sm text-white font-semibold rounded-full bg-darkblue`}>
            {quiz.difficulty === "easy" ? "Dễ" :
             quiz.difficulty === "medium" ? "Trung bình" :
             "Khó"}
          </p>
        </div>
        
        <h3 className="absolute bottom-4 left-4 right-4 text-xl font-bold text-white line-clamp-2">
          {quiz.name}
        </h3>
      </div>

      <div className="p-3">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
            <HugeiconsIcon icon={HelpSquareIcon} size={20} color="#FF5733" />
            <p className="font-medium text-sm">{quiz.questions?.length || 0} câu hỏi</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
            <HugeiconsIcon icon={Bookmark02Icon} size={18} color="#3366FF" />
            <p className="font-medium text-sm">{quiz.topic}</p>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
            <HugeiconsIcon icon={UserGroup03Icon} size={18} color="#3366FF" />
            <p className="font-medium text-sm">{quiz.totalPlays || 0} lượt chơi</p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-12 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 flex justify-center items-center rounded-full bg-darkblue">
              <HugeiconsIcon icon={PlayIcon} color="background" size={20} />
            </div>
            <span className="text-sm font-medium text-gray-600">Bắt đầu chơi</span>
          </div>
          <div className={`h-2 w-2 rounded-full ${quiz.difficulty === "easy" ? "bg-green-500" :
            quiz.difficulty === "medium" ? "bg-orange" :
            "bg-red-wine"}`}></div>
        </div>
      </div>
    </div>
  );
}

