import { HugeiconsIcon } from "@hugeicons/react";
import { Image02Icon, TextFirstlineLeftIcon } from "@hugeicons/core-free-icons";

export default function Quizbar({ quizOptions, setQuizOptions }: any) {
  const TIME_OPTIONS = [15, 30, 45, 60, 90];
  const SCORE_OPTIONS = [1, 2, 3, 4, 5];

  const handleChange = (e: any) => {
    setQuizOptions((prevVal: any) => ({
      ...prevVal,
      [e.target.name]: e.target.value,
    }));
  };
  return (
    <div className="col-span-3">
      <div className=" mb-5 bg-white box-shadow rounded-lg ">
        <div className="px-10 py-5">
          <p className="text-xl mb-5">Cập nhật toàn bộ câu hỏi</p>
          <div className="flex gap-2">
            <select
              name="timePerQuestion"
              value={quizOptions.timePerQuestion}
              onChange={handleChange}
              id="time"
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Time</option>
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
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Score</option>
              {SCORE_OPTIONS.map((score) => (
                <option key={score} value={score}>
                  {score} điểm
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div className="  bg-white box-shadow rounded-lg">
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
