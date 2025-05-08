import { useState } from "react";
import { useForm } from "react-hook-form";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Download03Icon,
  CalculatorIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import "./../style/dashboard.css";

const virtualData = {
  name: "React Hook Form provides an errors object to show you the errors in the form. errors' type will return given validation constraints. The following example showcases a required validation rule.",
  answers: [
    {
      text: "Handle errors",
      isCorrect: true,
    },
    {
      text: "React Hook Form",
      isCorrect: false,
    },
    {
      text: "validation ",
      isCorrect: false,
    },
    {
      text: "return ",
      isCorrect: false,
    },
  ],
};

export default function MultipleChoices({
  closeFormQuestion,
  getDataForm,
}: any) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [questionOptions, setQuestionOptions] = useState({
    questionType: "multipleChoices",
    questionText: "",
    timePerQuestion: 15,
    scorePerQuestion: 1,
    difficulty: "easy",
  });
  const [answers, setAnswers] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const createVirtualData = () => {
    setQuestionOptions({
      ...questionOptions,
      questionText: virtualData.name,
    });

    setAnswers(virtualData.answers.map((a) => ({ ...a })));
  };

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
    setQuestionOptions({
      ...questionOptions,
      [name]: value,
    });
  };
  const filledAnswers = answers.filter((a) => a.text.trim() !== "");
  const hasCorrect = answers.some((a) => a.isCorrect);
  const saveQuestion = () => {
    if (!hasCorrect || filledAnswers.length < 4) {
      return;
    }

    const questionData = {
      questionType: questionOptions.questionType,
      questionText: questionOptions.questionText,
      timePerQuestion: questionOptions.timePerQuestion,
      scorePerQuestion: questionOptions.scorePerQuestion,
      difficulty: questionOptions.difficulty,
      answers,
    };
    switch (questionOptions.questionType) {
      case "multipleChoices":
        questionData.questionType = "Nhiều lựa chọn";
        break;
      case "fillInBlank":
        questionData.questionType = "Điền vào chỗ trống";
        break;
      case "paragraph":
        questionData.questionType = "Đoạn văn";
        break;
      case "dragAndDrop":
        questionData.questionType = "Kéo và thả";
        break;
      case "dropdown":
        questionData.questionType = "Thả xuống";
        break;
    }
    getDataForm(questionData);
  };

  const closeForm = () => {
    closeFormQuestion();
  };

  return (
    <div
      className="bg-background p-10 rounded-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <nav className="h-16 py-2 flex justify-between items-center">
        <div className="flex items-center w-full justify-between">
          <div className="flex items-center gap-2">
            <select
              name="questionType"
              id="questionType"
              value={questionOptions.questionType}
              onChange={handleQuestionOptions}
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg block w-full p-2.5 font-semibold "
            >
              <option value="multipleChoices">Nhiều lựa chọn</option>
              <option value="fillInBlank">Điền vào chỗ trống</option>
              <option value="paragraph">Đoạn văn</option>
              <option value="dragAndDrop">Kéo và thả</option>
              <option value="dropDown">Thả xuống</option>
            </select>

            <select
              name="timePerQuestion"
              id="time"
              value={questionOptions.timePerQuestion}
              onChange={handleQuestionOptions}
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg block w-full p-2.5 font-semibold"
            >
              <option value={15}>15 giây</option>
              <option value={30}>30 giây</option>
              <option value={45}>45 giây</option>
              <option value={60}>1 phút</option>
              <option value={90}>1.5 phút</option>
            </select>
            <select
              name="scorePerQuestion"
              id="score"
              value={questionOptions.scorePerQuestion}
              onChange={handleQuestionOptions}
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg block w-full p-2.5 font-semibold"
            >
              <option value={1}>1 điểm</option>
              <option value={2}>2 điểm</option>
              <option value={3}>3 điểm</option>
              <option value={4}>4 điểm</option>
              <option value={5}>5 điểm</option>
            </select>
            <select
              name="difficulty"
              id="difficulty"
              value={questionOptions.difficulty}
              onChange={handleQuestionOptions}
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg block w-full p-2.5 font-semibold"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
          <div
            onClick={closeForm}
            className="w-10 h-10 cursor-pointer flex justify-center items-center rounded-full hover:text-red-wine"
          >
            <HugeiconsIcon icon={Cancel01Icon} />
          </div>
        </div>
      </nav>
      <div className=" flex items-center">
        <div>
          <div className=" p-2 hover:bg-gray-200 cursor-pointer rounded flex items-center gap-2">
            <HugeiconsIcon icon={CalculatorIcon} />
            <p className="text-sm">Chèn kí hiệu toán học</p>
          </div>
        </div>
      </div>
      <div className=" mt-20 ">
        <div className="bg-white p-5 rounded-lg box-shadow empower_component">
          <div className="rounded-lg overflow-hidden">
            <textarea
              className={`text-xl w-full text-center outline-none border-0 border-background bg-transparent p-2 flex rounded-md`}
              {...register("questionText", {
                required: "Câu hỏi không được để trống",
              })}
              value={questionOptions.questionText}
              onChange={handleQuestionOptions}
              rows={5}
              placeholder={
                errors.questionText
                  ? "Vui lòng nhập nội dung câu hỏi"
                  : "Nhập câu hỏi ở đây"
              }
              id=""
            ></textarea>
          </div>
          <div className="grain  rounded-2xl"></div>
          <div className="noise  rounded-2xl"></div>
          <div className="mt-5 grid grid-flow-col gap-2">
            {answers.map((answer, index) => (
              <div key={index} className="p-2 rounded-lg box-shadow">
                <div className="flex justify-between">
                  <button
                    onClick={() => handleDelete(index)}
                    className="cursor-pointer  h-8 w-8 flex justify-center items-center rounded hover:text-red-wine"
                    aria-label="Delete answer"
                  >
                    <HugeiconsIcon icon={Delete01Icon} size={20} />
                  </button>
                  {/* <div className="checkbox-wrapper-18">
                    <div className="round">
                      <input
                        type="checkbox"
                        id={`checkbox-${index}`}
                        checked={answer.isCorrect}
                        onChange={() => handleCheck(index)}
                      />
                      <label htmlFor={`checkbox-${index}`}></label>
                    </div>
                  </div> */}
                  <div className="checkbox-wrapper-26">
                    <input
                      type="checkbox"
                      id={`_checkbox-${index}`}
                      checked={answer.isCorrect}
                      onChange={() => handleCheck(index)}
                    />
                    <label htmlFor={`_checkbox-${index}`}>
                      <div className="tick_mark"></div>
                    </label>
                  </div>
                </div>
                <div className="relative">
                  <div className=" overflow-hidden mt-2 rounded-lg">
                    <textarea
                      className="text-xl w-full text-center bg-transparent outline-none p-2 flex"
                      value={answer.text}
                      onChange={(e) => handleChange(index, e.target.value)}
                      rows={8}
                      placeholder="Nhập câu trả lời ở đây"
                      aria-label={`Answer option ${index + 1}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* {filledAnswers.length < 4 && (
            <div className="text-red-wine ">
              <p className="text-sm">* Vui lòng nhập đầy đủ đáp án</p>
            </div>
          )}
          {!hasCorrect && (
            <div className="text-red-wine ">
              <p className="text-sm">* Chọn câu trả lời đúng</p>
            </div>
          )} */}
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={() => createVirtualData()}
          className="py-2 px-3 flex items-center mb-2 gap-2 cursor-pointer bg-orange btn-hover rounded font-semibold text-lg"
        >
          <HugeiconsIcon icon={Download03Icon} />
          <p>Dữ liệu ảo</p>
        </button>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSubmit(saveQuestion)}
          className="py-2 px-3 flex items-center gap-2 cursor-pointer bg-orange btn-hover rounded font-semibold text-lg"
        >
          <HugeiconsIcon icon={Download03Icon} />
          <p>Lưu</p>
        </button>
      </div>
    </div>
  );
}
