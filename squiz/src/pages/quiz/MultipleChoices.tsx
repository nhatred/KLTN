import { useState } from "react";
import { NavLink } from "react-router";

export default function MultipleChoices() {
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  function randomColor() {
    const number = Math.floor(Math.random() * 10);
    const colors = [
      "#FF0B55",
      "#FF8282",
      "#FFD63A",
      "#F7CFD8",
      "#60B5FF",
      "#8F87F1",
      "#67AE6E",
      "#FFD63A",
      "#4D55CC",
      "#F1E3D3",
    ];
    return colors[number];
  }

  const handleChange = (index: number, value: any) => {
    const newAnswers = [...answers];
    newAnswers[index].text = value;
    setAnswers(newAnswers);
  };

  const handleCheck = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[index].isCorrect = !newAnswers[index].isCorrect;
    setAnswers(newAnswers);
  };

  const handleDelete = (index: number) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1);
    setAnswers(newAnswers);
  };

  async function submitQuestion(formData: any) {
    const query = {
      timePerQuestion: formData.get("time"),
      scorePerQuestion: formData.get("score"),
      questionType: formData.get("questionType"),
      questionText: formData.get("questionText"),
      answers: answers,
    };
    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(query),
      });
      if (!response.ok)
        throw new Error("Failed to save question at MultipleChoice.tsx");

      const savedQuestion = await response.json();
      console.log("Question save:", savedQuestion);
    } catch (error) {
      console.error("error saving at MultipleChoice.tsx", error);
    }
  }

  return (
    <form action={submitQuestion}>
      <nav className="h-16 fixed left-0 right-0 border-b-1 border-orange-600 bg-orange-soft py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <NavLink to="/create-quiz">
            <h1 className="border-1 bg-white w-8 h-8 flex items-center justify-center rounded font-black">
              <i className="fa-solid fa-arrow-left"></i>
            </h1>
          </NavLink>
          <select
            name="questionType"
            id="questionType"
            className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
          >
            <option value="multipleChoices">Nhiều lựa chọn</option>
            <option value="fillInBlank">Điền vào chỗ trống</option>
            <option value="paragraph">Đoạn văn</option>
            <option value="dragAndDrop">Kéo và thả</option>
            <option value="dropDown">Thả xuống</option>
          </select>
        </div>
        <div className="flex items-center gap-5">
          <div className="flex gap-2">
            <select
              name="time"
              id="time"
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Thời gian</option>
              <option value="15">15 giây</option>
              <option value="30">30 giây</option>
              <option value="45">45 giây</option>
              <option value="60">1 phút</option>
              <option value="90">1.5 phút</option>
            </select>
            <select
              name="score"
              id="score"
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Điểm</option>
              <option value="1">1 điểm</option>
              <option value="2">2 điểm</option>
              <option value="3">3 điểm</option>
              <option value="4">4 điểm</option>
              <option value="5">5 điểm</option>
            </select>
          </div>
          <button
            type="submit"
            className="py-2 px-3 flex items-center gap-2 cursor-pointer bg-nude-semibold btn-hover rounded font-semibold text-lg"
          >
            <i className="fa-solid fa-floppy-disk"></i>
            <p>Lưu</p>
          </button>
        </div>
      </nav>
      <div className="bg-gray-200 pt-16 flex items-center h-28">
        <div className="ml-5 p-2 hover:bg-gray-50 cursor-pointer rounded flex items-center gap-2">
          <i className="fa-solid fa-square-root-variable"></i>
          <p className="text-sm">Chèn kí hiệu toán học</p>
        </div>
      </div>
      <div className="container mx-auto px-40 mt-20">
        <div className="bg-orange-soft p-5 rounded-lg box-shadow">
          <div className="border rounded-lg overflow-hidden">
            <textarea
              className="text-xl w-full text-center outline-none p-2 flex"
              name="questionText"
              rows={5}
              placeholder="Nhập câu hỏi ở đây"
              id=""
            ></textarea>
          </div>
          <div className="mt-5 grid grid-flow-col gap-2">
            {answers.map((answer, index) => (
              <div
                key={index}
                className="p-2 rounded-lg"
                style={{ background: randomColor() }}
              >
                <div className="flex justify-between">
                  <button
                    onClick={() => handleDelete(index)}
                    className="cursor-pointer bg-white h-8 w-8 flex justify-center items-center rounded hover:bg-gray-100"
                    aria-label="Delete answer"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                  </button>
                  <div className="checkbox-wrapper-18">
                    <div className="round">
                      <input
                        type="checkbox"
                        id={`checkbox-${index}`}
                        checked={answer.isCorrect}
                        onChange={() => handleCheck(index)}
                      />
                      <label htmlFor={`checkbox-${index}`}></label>
                    </div>
                  </div>
                </div>
                <div className="border mt-2 rounded-lg overflow-hidden">
                  <textarea
                    className="text-xl w-full text-center outline-none p-2 flex"
                    value={answer.text}
                    onChange={(e) => handleChange(index, e.target.value)}
                    rows={8}
                    placeholder="Nhập câu trả lời ở đây"
                    aria-label={`Answer option ${index + 1}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </form>
  );
}
