import { useState } from "react";

export default function MultipleChoices({
  closeFormQuestion,
  getDataForm,
}: any) {
  const [questionOptions, setQuestionOptions] = useState({
    questionType: "multipleChoices",
    questionText: "",
    timePerQuestion: 30,
    scorePerQuestion: 1,
  });
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

  const handleQuestionOptions = (e: any) => {
    const { name, value } = e.target;
    setQuestionOptions((prevVal) => ({
      ...prevVal,
      [name]: value,
    }));
  };

  const saveQuestion = () => {
    const questionData = {
      questionType: questionOptions.questionType,
      timePerQuestion: questionOptions.timePerQuestion,
      scorePerQuestion: questionOptions.scorePerQuestion,
      answers,
    };
    getDataForm(questionData);
  };

  const closeForm = () => {
    closeFormQuestion();
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <nav className="h-16  py-2 flex justify-between items-center">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-5">
            <select
              name="questionType"
              id="questionType"
              value={questionOptions.questionType}
              onChange={handleQuestionOptions}
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="multipleChoices">Nhiều lựa chọn</option>
              <option value="fillInBlank">Điền vào chỗ trống</option>
              <option value="paragraph">Đoạn văn</option>
              <option value="dragAndDrop">Kéo và thả</option>
              <option value="dropDown">Thả xuống</option>
            </select>

            <select
              name="time"
              id="time"
              onChange={handleQuestionOptions}
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
              onChange={handleQuestionOptions}
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
          <div
            onClick={closeForm}
            className="w-10 h-10 cursor-pointer flex justify-center items-center rounded-full hover:bg-nude-semibold"
          >
            <i className="text-2xl text-red-wine fa-solid fa-xmark"></i>
          </div>
        </div>
      </nav>
      <div className=" flex items-center">
        <div>
          <div className=" p-2 hover:bg-gray-200 bg-white cursor-pointer rounded flex items-center gap-2">
            <i className="fa-solid fa-square-root-variable"></i>
            <p className="text-sm">Chèn kí hiệu toán học</p>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-40 mt-20">
        <div className="bg-orange-soft p-5 rounded-lg box-shadow">
          <div className="border rounded-lg overflow-hidden">
            <textarea
              className="text-xl w-full text-center outline-none p-2 flex"
              name="questionText"
              value={questionOptions.questionText}
              onChange={handleQuestionOptions}
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
      <div className="flex justify-end">
        <button
          onClick={saveQuestion}
          className="py-2 px-3 flex items-center gap-2 cursor-pointer bg-orange-soft hover:bg-orange-semibold rounded font-semibold text-lg"
        >
          <i className="fa-solid fa-floppy-disk"></i>
          <p>Lưu</p>
        </button>
      </div>
    </div>
  );
}
