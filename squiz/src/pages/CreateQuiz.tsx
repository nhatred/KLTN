import { NavLink } from "react-router";
import Quizbar from "../components/Quizbar";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import MultipleChoices from "../components/quiz/MultipleChoices";

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
  const [questions, setQuestions] = useState([{}]);
  // const questions = Array<any>();
  const [imageData, setImageData] = useState<File | null>(null);
  const [quizOptions, setQuizOptions] = useState({
    timePerQuestion: 30,
    scorePerQuestion: 1,
  });

  // Them cau hoi
  // const addQuestion = () => {
  //   const newQuestion = {
  //     tempId: Date.now(),
  //     questionText: "",
  //     questionType: "",
  //     answers: [],
  //   };
  //   setQuestions((prevVal) => ({
  //     ...prevVal,
  //     newQuestion,
  //   }));
  // };
  const handleGetDataForm = (data: any) => {
    const newQuestion = {
      questionId: Date.now(),
      questionType: data.questionType,
      timePerQuestion: data.timePerQuestion,
      scorePerQuestion: data.scorePerQuestion,
      answers: data.answers,
    };
    setQuestions((prevVal) => [...prevVal, newQuestion]);
    questions.push(newQuestion);
  };
  // Update question
  // const updateQuestion = (tempId: any, field: any, value: any) => {
  //   const updateQuestions = questions.map((question: any) =>
  //     question.tempId === tempId ? { ...question, [field]: value } : question
  //   );
  //   setQuestions(updateQuestions);
  // };

  // const removeQuestion = (tempId: any) => {
  //   setQuestions(questions.filter((q) => q.tempId !== tempId));
  // };

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

  // const handleGetDataForm = (data: any) => {
  //   setQuizData((prevVal) => ({
  //     ...prevVal,
  //     questions: [...prevVal.questions, data],
  //   }));
  // };

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

      const data = await response.json();
      if (response.ok) {
        console.log("Quiz created!");
        const quizId = data._id;
        const questionPromises = questions.map((question) => {
          const { questionId, ...questionData } = question;
          questionData.quizId = quizId;
          return fetch("http://localhost:5000/api/question", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(questionData),
          }).then((res) => res.json());
        });
        await Promise.all(questionPromises);
      } else {
        console.log("Loi tao quiz", data);
      }
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert("Failed to save quiz. Please try again.");
    }
  };

  return (
    <div className="container mx-auto px-40">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSaveQuiz();
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
          <button type="submit" className="flex items-center gap-5">
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
              <p className="text-xl mb-5">Quizz options</p>
              <div className="grid grid-cols-2 mb-2 gap-2">
                <input
                  name="name"
                  type="text"
                  value={quizData.name}
                  onChange={handleQuizDataChange}
                  placeholder="Enter Quizz name"
                  className="border p-2.5 text-sm font-semibold rounded-lg"
                />
                <select
                  name="topic"
                  id="Topic"
                  value={quizData.topic}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="">Topic</option>
                  <option value="math">Math</option>
                  <option value="english">English</option>
                  <option value="physics">Physics</option>
                  <option value="history">History</option>
                  <option value="other">Other</option>
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
                  <option value="">Difficulty</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select
                  name="isPublic"
                  id="Display"
                  value={quizData.isPublic}
                  onChange={handleQuizDataChange}
                  className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                >
                  <option value="public">Public</option>
                  <option value="Private">Private</option>
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
                <p className="text-xl">1 question (3 points)</p>
                <div
                  onClick={handleClickModal}
                  className="flex hover:bg-gray-50 cursor-pointer bg-white border-orange-semibold border-1 items-center gap-2 py-1 px-3 rounded font-semibold text-lg"
                >
                  <i className="fa-solid fa-plus"></i>
                  <p>New question</p>
                </div>
              </div>
              <div>
                <div className="w-full px-8 py-5 mt-5 bg-white rounded-lg col-span-5 box-shadow">
                  <div className=" flex justify-between">
                    <div className="flex gap-2">
                      <div className="border cursor-grab p-2 rounded flex items-center">
                        <i className="fa-solid fa-align-justify"></i>
                      </div>
                      <div className="border p-2 rounded flex items-center gap-2">
                        <i className="fa-regular fa-circle-check"></i>
                        <p className="text-sm">Multi option</p>
                      </div>
                      <div>
                        <select
                          name="time"
                          id="time"
                          className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Time</option>
                          <option value="15">15 second</option>
                          <option value="30">30 second</option>
                          <option value="45">45 second</option>
                          <option value="60">1 minute</option>
                          <option value="90">1.5 minute</option>
                        </select>
                      </div>
                      <div>
                        <select
                          name="score"
                          id="score"
                          className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        >
                          <option value="">Score</option>
                          <option value="1">1 point</option>
                          <option value="2">2 point</option>
                          <option value="3">3 point</option>
                          <option value="4">4 point</option>
                          <option value="5">5 point</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2">
                        <i className="fa-regular fa-copy"></i>
                      </div>
                      <div className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2">
                        <i className="fa-regular fa-pen-to-square"></i>
                        <p className="text-sm">Edit</p>
                      </div>

                      <div className="border hover:bg-gray-50 cursor-pointer p-2 rounded flex items-center gap-2">
                        <i className="fa-regular fa-trash-can"></i>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p>
                      Lorem ipsum dolor sit amet consectetur adipisicing elit.
                      Culpa, molestiae veniam magni voluptate officia placeat
                      unde ipsa asperiores deserunt laboriosam quia, accusamus
                      pariatur dolorum modi earum odio quaerat, ipsum optio?
                    </p>
                    <p className="text-sm mt-5 mb-2 font-semibold">Answers</p>
                    <div className="grid grid-cols-2 grid-rows-2 gap-2">
                      <div className="flex items-center gap-2">
                        <i className="text-emerald fa-solid fa-check"></i>
                        <p>Answer 1</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="text-red-wine fa-solid fa-xmark"></i>
                        <p>Answer 12</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="text-red-wine fa-solid fa-xmark"></i>
                        <p>Answer 13</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <i className="text-red-wine fa-solid fa-xmark"></i>
                        <p>Answer 15</p>
                      </div>
                    </div>
                  </div>
                </div>

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
