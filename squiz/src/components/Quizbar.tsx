import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon, TextFirstlineLeftIcon } from "@hugeicons/core-free-icons";

interface QuizbarProps {
  quizOptions: {
    timePerQuestion: number;
    scorePerQuestion: number;
  };
  setQuizOptions: (options: any) => void;
  onApplyToAll?: () => void;
}

export default function Quizbar({
  quizOptions,
  setQuizOptions,
  onApplyToAll,
}: QuizbarProps) {
  const TIME_OPTIONS = [15, 30, 45, 60, 90];
  const SCORE_OPTIONS = [1, 2, 3, 4, 5];

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuizOptions((prevVal: any) => ({
      ...prevVal,
      [name]: Number(value),
    }));
  };

  return (
    <div className="col-span-3">
      <div className="mb-5 bg-white box-shadow rounded-lg">
        <div className="px-10 py-5">
          <div className="flex justify-between items-center mb-5">
            <p className="text-xl">Giá trị mặc định cho câu hỏi mới</p>
            {onApplyToAll && (
              <button
                onClick={onApplyToAll}
                className="px-4 py-2 text-sm font-medium text-white bg-orange hover:bg-orange/90 rounded-lg transition-colors duration-200"
              >
                Áp dụng cho tất cả
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              name="timePerQuestion"
              value={quizOptions.timePerQuestion}
              onChange={handleChange}
              id="time"
              className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold"
            >
              {TIME_OPTIONS.map((time) => (
                <option key={time} value={time}>
                  {time} giây
                </option>
              ))}
            </select>
            <select
              name="scorePerQuestion"
              id="score"
              value={quizOptions.scorePerQuestion}
              onChange={handleChange}
              className="bg-white border outline-none border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold"
            >
              {SCORE_OPTIONS.map((score) => (
                <option key={score} value={score}>
                  {score} điểm
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            * Các giá trị này sẽ được áp dụng cho câu hỏi mới. Để áp dụng cho
            tất cả câu hỏi, nhấn nút "Áp dụng cho tất cả"
          </p>
        </div>
      </div>
      <div className="bg-white box-shadow rounded-lg">
        <div className="px-10 py-5">
          <p className="text-xl mb-5">Import from</p>
          <div className="grid gap-2">
            <div className="flex border hover:bg-slate-50 cursor-pointer rounded-lg px-2 py-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Image02Icon} />
                <p className="text-sm font-semibold">Image</p>
              </div>
              <i className="fa-solid fa-angle-right"></i>
            </div>
            <div className="flex border hover:bg-slate-50 cursor-pointer rounded-lg px-2 py-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={TextFirstlineLeftIcon} />
                <p className="text-sm font-semibold">Google form</p>
              </div>
              <i className="fa-solid fa-angle-right"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
