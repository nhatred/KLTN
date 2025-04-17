import { NavLink } from "react-router";
import Quizbar from "../components/Quizbar";

export default function CreateQuiz() {
  return (
    <div className="container mx-auto px-40">
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
        <div className="flex items-center gap-5">
          <div className="p-3 flex items-center gap-2 cursor-pointer bg-nude-semibold btn-hover rounded font-semibold text-lg">
            <i className="fa-solid fa-floppy-disk"></i>
            <p>Save</p>
          </div>
        </div>
      </nav>
      <main className="pt-28 grid grid-cols-8 gap-8">
        <Quizbar />

        <div className="col-span-5">
          <form className="w-full px-8 py-5 bg-white rounded-lg col-span-5 box-shadow">
            <p className="text-xl mb-5">Quizz options</p>
            <div className="grid grid-cols-2 mb-2 gap-2">
              <input
                type="text"
                placeholder="Enter Quizz name"
                className="border p-2.5 text-sm font-semibold rounded-lg"
              />
              <select
                name="Topic"
                id="Topic"
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
                name="Difficulty"
                id="Difficulty"
                className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="">Difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <select
                name="Display"
                id="Display"
                className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
              >
                <option value="public">Public</option>
                <option value="Private">Private</option>
              </select>
            </div>
            <input className="mt-5" id="dropzone-file" type="file" />
          </form>
          <div>
            <div>
              <p>1 question (3 point)</p>
              <div>
                <div className="flex bg-white items-center gap-2 py-1 px-3 rounded font-semibold text-lg">
                  <i className="fa-solid fa-plus"></i>
                  <p>New question</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
