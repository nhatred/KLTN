export default function Quizbar() {
  return (
    <div className="col-span-3">
      <div className=" mb-5 bg-white box-shadow rounded-lg">
        <div className="px-10 py-5">
          <p className="text-xl mb-5">Bulk update questions</p>
          <div className="flex gap-2">
            <select
              name="time"
              id="time"
              className="bg-white  border outline-none border-gray-300  text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 font-semibold dark:focus:ring-blue-500 dark:focus:border-blue-500"
            >
              <option value="">Time</option>
              <option value="15">15 second</option>
              <option value="30">30 second</option>
              <option value="45">45 second</option>
              <option value="60">1 minute</option>
              <option value="90">1.5 minute</option>
            </select>
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
      </div>
      <div className="  bg-white box-shadow rounded-lg">
        <div className="px-10 py-5">
          <p className="text-xl mb-5">Import from</p>
          <div className="grid gap-2">
            <div className="flex border hover:bg-slate-50 cursor-pointer rounded-lg px-2 py-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <i className=" text-xl fa-solid fa-image"></i>
                <p className="text-sm font-semibold">Image</p>
              </div>
              <i className="fa-solid fa-angle-right"></i>
            </div>
            <div className="flex border hover:bg-slate-50 cursor-pointer rounded-lg px-2 py-3 justify-between items-center">
              <div className="flex items-center gap-2">
                <i className="text-xl fa-solid fa-align-justify"></i>
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
