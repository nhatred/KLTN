import { NavLink } from "react-router";
import Quizbar from "../components/Quizbar";
import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import MultipleChoices from "../components/quiz/MultipleChoices";

interface Question {
  questionId: number;
  quizId: string;
  questionType: string;
  questionText: string;
  timePerQuestion: number;
  scorePerQuestion: number;
  difficulty: string;
  answers: any[];
}

export default function CreateQuiz() {
  const handleClickModal: React.MouseEventHandler<HTMLDivElement> = () => {
    setIsModal((preVal) => !preVal);
  };

  const [isModal, setIsModal] = useState(false);
  const { getToken } = useAuth();
  const [isFormQuestion, setIsFormQuestion] = useState(false);

  const [quizData, setQuizData] = useState({
    creator: "",
    name: "",
    topic: "",
    difficulty: "",
    isPublic: "public",
    questions: [{}],
    imageUrl: null,
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [imageData, setImageData] = useState<File | null>(null);
  const [quizOptions, setQuizOptions] = useState({
    timePerQuestion: 30,
    scorePerQuestion: 1,
  });
  useEffect(() => {
    console.log(questions);
  }, [questions]);

  const handleGetDataForm = (data: any) => {
    const newQuestion = {
      questionId: Date.now(),
      quizId: "",
      questionType: data.questionType,
      questionText: data.questionText,
      timePerQuestion: data.timePerQuestion,
      scorePerQuestion: data.scorePerQuestion,
      difficulty: data.difficulty,
      answers: data.answers,
    };
    switch (data.questionType) {
      case "Nhiều lựa chọn":
        newQuestion.questionType = "multipleChoices";
        break;
      case "Điền vào chỗ trống":
        newQuestion.questionType = "fillInBlank";
        break;
      case "Đoạn văn":
        newQuestion.questionType = "paragraph";
        break;
      case "Kéo và thả":
        newQuestion.questionType = "dragAndDrop";
        break;
      case "Thả xuống":
        newQuestion.questionType = "dropdown";
        break;
    }
    setQuestions((prevVal) => [...prevVal, newQuestion]);
  };

  // UPDATE CAU HOI
  const handleQuestionUpdate = (e: any, questionId: number | string) => {
    const { name, value } = e.target;

    setQuestions((prevQuestions) =>
      prevQuestions.map((question) =>
        question.questionId === questionId
          ? {
              ...question,
              [name]: value,
            }
          : question
      )
    );
  };

  // SAO CHEP CAU HOI
  const duplicateQuestion = (question: any) => {
    const duplicatedQuestion = {
      ...question,
      questionId: Date.now(),
    };

    setQuestions((prevQuestions) => [...prevQuestions, duplicatedQuestion]);
  };

  // XOA CAU HOI
  const deleteQuestion = (questionId: any) => {
    setQuestions((prevQuestions) =>
      prevQuestions.filter((q) => q.questionId !== questionId)
    );
  };

  // Khi thong tin quiz thay doi
  const handleQuizDataChange = (e: any) => {
    const { name, value } = e.target;
    setQuizData({
      ...quizData,
      [name]: value,
    });
  };

  const handleImageUpload = (e: any) => {
    if (e.target.files != null) {
      setImageData(e.target.files[0]);
    }
  };

  const showFormQuestion = () => {
    setIsFormQuestion((prevVal) => !prevVal);
    setIsModal((prevVal) => !prevVal);
  };

  const totalScoreOfQuiz = () => {
    let totalScore = 0;
    questions.map((question) => {
      console.log(question.scorePerQuestion);
      totalScore += Number(question.scorePerQuestion);
    });
    return totalScore;
  };

  // Save
  const handleSaveQuiz = async () => {
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append("creator", "User1");
      formData.append("name", quizData.name);
      formData.append("topic", quizData.topic);
      formData.append("difficulty", quizData.difficulty);
      formData.append("isPublic", quizData.isPublic);
      formData.append("imageUrl", imageData || "");
      // formData.append("questions", JSON.stringify(quizData.questions || []));
      formData.append("timePerQuestion", String(quizOptions.timePerQuestion));
      formData.append("scorePerQuestion", String(quizOptions.scorePerQuestion));
      const response = await fetch("http://localhost:5000/api/quiz", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const quizResult = await response.json();
      if (!quizResult.success) {
        throw new Error(quizResult.message || "Cannot created new Quiz");
      }
      // Thay vì cập nhật state, tạo một bản sao mới của questions với quizId đã cập nhật
      const updatedQuestions = questions.map((question) => ({
        ...question,
        quizId: quizResult._id,
      }));
      await handleSaveQuestion(updatedQuestions);
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    }
  };
  const handleSaveQuestion = async (questionsToSave = questions) => {
    try {
      const token = await getToken();
      const response = await fetch("http://localhost:5000/api/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          questions: questionsToSave.map((question) => ({
            quizId: question.quizId,
            questionText: question.questionText,
            questionType: question.questionType,
            difficulty: question.difficulty,
            timePerQuestion: question.timePerQuestion,
            scorePerQuestion: question.scorePerQuestion,
            answers: question.answers.map((answer) => ({
              text: answer.text,
              isCorrect: answer.isCorrect,
            })),
          })),
        }),
      });
      await response.json();
    } catch (error) {
      console.error("Error saving quiz:", error);
    }
  };
  return (
    <div className="container mx-auto px-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <nav className="h-16 fixed left-0 right-0 border-b-1 border-orange-600 bg-orange-soft py-2 px-4 flex justify-between items-center">
          <div className="flex items-center gap-5">
            <NavLink to="/">
              <h1 className="border-1 bg-white w-8 h-8 flex items-center justify-center rounded font-black">
                <i className="fa-solid fa-arrow-left"></i>
              </h1>
            </NavLink>
            <div className=" h-10 px-2 hover:bg-nude-light rounded cursor-pointer flex items-center">
              <p className="font-semibold">Please enter Quizz name</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleSaveQuiz();
            }}
            className="flex items-center gap-5"
          >
            <div className="p-3 flex items-center gap-2 cursor-pointer bg-nude-semibold btn-hover rounded font-semibold text-lg">
              <i className="fa-solid fa-floppy-disk"></i>
              <p>Save</p>
            </div>
          </button>
        </nav>
        <main className="pt-28 grid grid-cols-8 gap-8">
          <Quizbar quizOptions={quizOptions} setQuizOptions={setQuizOptions} />

          <div className="col-span-5">
            <div className="w-full px-8 py-5 bg-white rounded-lg col-span-5 box-shadow">
              <p className="text-xl mb-5">Thông tin Quiz</p>
              <div className="grid grid-cols-2 mb-2 gap-2">
                <input
                  name="name"
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Nhập tên Quiz"
                  className="border p-2.5 text-sm font-semibold rounded-lg"
                />
                <select
                  name="topic"
                  id="Topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">Chủ đề</option>
                  <option value="math">Toán</option>
                  <option value="english">Tiếng Anh</option>
                  <option value="physics">Vật lý</option>
                  <option value="history">Lịch sử</option>
                  <option value="other">Khác</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  name="difficulty"
                  id="Difficulty"
                  value={quizData.difficulty}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">Độ khó</option>
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
                <select
                  name="isPublic"
                  id="Display"
                  value={quizData.isPublic}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="public">Công khai</option>
                  <option value="Private">Riêng tư</option>
                </select>
              </div>
              <input
                accept="image/*"
                name="imageUrl"
                className="mt-5"
                type="file"
                onChange={handleImageUpload}
              />
              <img
                src={imageData ? URL.createObjectURL(imageData) : ""}
                alt=""
              />
            </div>

            <div>
              <div className="flex  justify-between mt-5">
                <p className="text-xl">
                  {questions.length} Câu hỏi ({totalScoreOfQuiz()} điểm)
                </p>
                <div
                  onClick={handleClickModal}
                  className="flex hover:bg-gray-50 cursor-pointer bg-white border-orange-semibold border-1 items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                >
                  <i className="fa-solid fa-plus"></i>
                  <p>Câu hỏi mới</p>
                </div>
              </div>
              <div>
                {questions.map((question) => (
                  <div
                    key={question.questionId}
                    className="w-full px-8 py-5 mt-5 bg-white rounded-lg col-span-5 box-shadow"
                  >
                    <div className=" flex justify-between">
                      <div className="flex gap-2">
                        <div className="border cursor-grab p-2 rounded flex items-center">
                          <i className="fa-solid fa-align-justify"></i>
                        </div>
                        <div className="border p-2 rounded flex items-center gap-2">
                          <i className="fa-regular fa-circle-check"></i>
                          <p className="text-sm">{question.questionType}</p>
                        </div>
                        <div>
                          <select
                            name="timePerQuestion"
                            id="time"
                            value={question.timePerQuestion}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            {[15, 30, 45, 60, 90].map((time) => (
                              <option key={time} value={time}>
                                {time} giây
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="scorePerQuestion"
                            id="score"
                            value={question.scorePerQuestion}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            {[1, 2, 3, 4, 5].map((score) => (
                              <option key={score} value={score}>
                                {score} điểm
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <select
                            name="difficulty"
                            id="difficulty"
                            value={question.difficulty}
                            onChange={(e) =>
                              handleQuestionUpdate(e, question.questionId)
                            }
                            className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                          >
                            {["ease", "medium", "hard"].map((difficulty) => (
                              <option key={difficulty} value={difficulty}>
                                {difficulty === "easy"
                                  ? "Dễ"
                                  : difficulty === "medium"
                                  ? "Trung bình"
                                  : "Khó"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div
                          onClick={() => duplicateQuestion(question)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <i className="fa-regular fa-copy"></i>
                        </div>
                        <div className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2">
                          <i className="fa-regular fa-pen-to-square"></i>
                          <p className="text-sm">Chỉnh sửa</p>
                        </div>

                        <div
                          onClick={() => deleteQuestion(question.questionId)}
                          className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2"
                        >
                          <i className="fa-regular fa-trash-can"></i>
                        </div>
                      </div>
                    </div>
                    <div className="mt-5">
                      <p>{question.questionText}</p>
                      <p className="text-sm mt-5 mb-2 font-semibold">Answers</p>
                      <div className="grid grid-cols-2 grid-rows-2 gap-2">
                        {question.answers.map((answer, key) => (
                          <div key={key} className="flex items-center gap-2">
                            {answer.isCorrect ? (
                              <i className="text-emerald fa-solid fa-check"></i>
                            ) : (
                              <i className="text-red-wine fa-solid fa-xmark"></i>
                            )}
                            <p>{answer.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                {/* New Question */}
                <div className="flex justify-center mt-5">
                  <div
                    onClick={handleClickModal}
                    className="flex hover:bg-gray-50 cursor-pointer bg-white border-orange-semibold border-1 items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                  >
                    <i className="text-sm fa-solid fa-plus"></i>
                    <p className="text-sm">New question</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* New Question Option Modal */}
        {isModal ? (
          <div
            onClick={handleClickModal}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="bg-white px-8 pb-8 rounded-lg container mx-80"
            >
              <div className="flex my-1 justify-end">
                <div
                  onClick={handleClickModal}
                  className=" w-5 h-5 my-1 flex justify-center items-center rounded hover:bg-gray-100 cursor-pointer"
                >
                  <i className="text-sm fa-solid fa-xmark"></i>
                </div>
              </div>
              <div className="border-1 rounded-lg grid grid-cols-2">
                <div className="p-5 grid grid-cols-2 gap-x-8 gap-y-2 border-r">
                  <div
                    onClick={showFormQuestion}
                    className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded"
                  >
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="text-xl  fa-regular fa-circle-check"></i>
                    </div>
                    <p className="font-semibold">Nhiều lựa chọn</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-square"></i>
                    </div>
                    <p className="font-semibold">Điền vào chỗ trống</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-solid fa-bars-staggered"></i>
                    </div>
                    <p className="font-semibold">Đoạn văn</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-hand"></i>
                    </div>
                    <p className="font-semibold">Kéo và thả</p>
                  </div>
                  <div className="flex items-center gap-2 hover:bg-gray-100 cursor-pointer p-2 rounded">
                    <div className="bg-orange-soft rounded h-8 w-8 flex items-center justify-center">
                      <i className="fa-regular fa-square-caret-down"></i>
                    </div>
                    <p className="font-semibold">Thả xuống</p>
                  </div>
                </div>
                <div className="bg-nude-light">
                  <div className="p-8">
                    <p className="font-semibold mb-2">Thả xuống</p>
                    <p className="text-sm">
                      Thả xuống Nâng cấp phần điền vào chỗ trống của bạn thành
                      các câu hỏi thả xuống dễ dàng để sinh viên có thể chọn từ
                      danh sách các tùy chọn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
        {isFormQuestion && (
          <div
            onClick={showFormQuestion}
            className="fixed left-0 top-0 right-0 bottom-0 bg-modal flex justify-center items-center"
          >
            <div
              onClick={(e: any) => e.stopPropagation()}
              className="bg-nude-light p-8 rounded-lg"
            >
              <MultipleChoices
                closeFormQuestion={showFormQuestion}
                getDataForm={handleGetDataForm}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
