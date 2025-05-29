import { useEffect } from "react";
import { format } from "date-fns";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  PlayIcon,
  Bookmark02Icon,
  HelpSquareIcon,
  Share08Icon,
  UserGroup03Icon,
  FavouriteIcon,
} from "@hugeicons/core-free-icons";
import { NavLink } from "react-router";
import "../style/quizcard.css";
import { Quiz } from "../types/Quiz";

export default function QuizDetailModal({
  quiz,
  onClose,
}: {
  quiz: Quiz;
  onClose: () => void;
}) {
  const formatPlayCount = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + "K";
    }
    return count.toString();
  };

  // Chặn cuộn trang khi modal được mở
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  // Chia sẻ liên kết quiz
  const handleShare = () => {
    const quizUrl = window.location.origin + `/join-quiz/${quiz?._id}`;

    // Sử dụng API Chia sẻ Web nếu có sẵn
    if (navigator.share) {
      navigator
        .share({
          title: quiz?.name,
          text: `Tham gia Quiz: ${quiz?.name}`,
          url: quizUrl,
        })
        .catch((err) => {
          console.log("Error sharing:", err);
          // Ghi lai vào clipboard
          navigator.clipboard.writeText(quizUrl);
          alert("Link đã được sao chép vào clipboard!");
        });
    } else {
      // Ghi lai vào clipboard
      navigator.clipboard.writeText(quizUrl);
      alert("Link đã được sao chép vào clipboard!");
    }
  };

  if (!quiz) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background w-11/12 md:w-3/4 lg:w-2/5 max-h-[90vh] overflow-y-auto box-shadow flex flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative quizcard_component">
          <img
            className="w-full h-full object-cover rounded-t-2xl"
            src={quiz?.imageUrl || "/assets/default-quiz-cover.jpg"}
            alt={quiz?.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-2xl"></div>

          <div className="absolute top-4 right-4">
            <p
              className={`py-1 px-4 text-sm text-background font-semibold rounded-full ${
                quiz?.difficulty === "easy"
                  ? "bg-green-500"
                  : quiz?.difficulty === "medium"
                  ? "bg-orange"
                  : "bg-red-wine"
              }`}
            >
              {quiz?.difficulty === "easy"
                ? "Dễ"
                : quiz?.difficulty === "medium"
                ? "Trung bình"
                : "Khó"}
            </p>
          </div>

          <h3 className="absolute bottom-4 left-4 right-4 text-xl md:text-2xl font-bold text-white">
            {quiz?.name}
          </h3>

          <div className="grain-quiz rounded-t-2xl"></div>
          <div className="noise-quiz rounded-t-2xl"></div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start flex-wrap gap-4 mb-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <HugeiconsIcon
                  icon={HelpSquareIcon}
                  size={20}
                  color="#FF5733"
                />
                <p className="font-semibold">
                  {quiz?.questions?.length || 0} câu hỏi
                </p>
              </div>

              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <HugeiconsIcon
                  icon={Bookmark02Icon}
                  size={18}
                  color="#3366FF"
                />
                <p className="font-semibold">{quiz?.topic}</p>
              </div>

              <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
                <HugeiconsIcon
                  icon={UserGroup03Icon}
                  size={18}
                  color="#3366FF"
                />
                <p className="font-semibold">
                  {formatPlayCount(quiz?.totalPlays || 0)} lượt chơi
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-full">
              <HugeiconsIcon icon={FavouriteIcon} />
            </div>
          </div>
          <div className="flex items-center gap-3 mb-6 border-t border-gray-200 pt-4">
            <img
              src={quiz?.creatorInfo?.avatar}
              alt="Creator"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
            />
            <div>
              <p className="text-sm text-gray-500">Tạo bởi</p>
              <p className="font-semibold">
                {quiz?.creatorInfo?.name || "Người dùng ẩn danh"}
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm text-gray-500">Ngày đăng</p>
              <p className="font-medium">
                {quiz?.createdAt
                  ? format(new Date(quiz.createdAt), "dd/MM/yyyy")
                  : "-"}
              </p>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-300 btn-hover w-1/3"
              onClick={handleShare}
            >
              <HugeiconsIcon icon={Share08Icon} size={22} />
              <span className="font-semibold">Chia sẻ</span>
            </button>

            <NavLink
              to={`/join-quiz/${quiz?._id}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-orange btn-hover w-2/3"
            >
              <span className="text-darkblue font-bold">Chơi ngay</span>
              <HugeiconsIcon icon={PlayIcon} size={26} color="#0A0A3F" />
            </NavLink>
          </div>
        </div>
      </div>
    </div>
  );
}
