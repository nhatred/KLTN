import QuizzCard from "../components/QuizzCard";
export default function Dashboard() {
  return (
    <div className=" pt-16">
      <div className="grid h-40 grid-cols-3 gap-5 mt-10 mb-24">
        <div className="bg-[#ffebcc] box-shadow col-span-2 py-16 rounded-xl ">
          <div className="flex  flex-col justify-center items-center">
            <div className="w-2/3 bg-white grid grid-cols-6 justify-between gap-2 border-b-blue-deep rounded-xl border-[1px] border-solid p-2">
              <input
                className="px-1 py-3 text-xl col-span-4"
                type="text"
                placeholder="Nhập mã tham gia"
              />
              <button className="py-1 px-4 col-span-2 text-lg font-bold rounded-xl bg-orange-soft hover:bg-orange-semibold transition-all duration-500">
                Tham gia
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center relative bg-orange-soft box-shadow rounded-xl">
          <h1 className="text-2xl ml-5">
            Xin chào,<br></br> tôi là Squizz
          </h1>
          <img
            className="h-40 absolute right-0 bottom-0"
            src="\assets\squizz.png"
            alt=""
          />
        </div>
      </div>
      <div className="mb-16">
        <div className="flex justify-between">
          <h1 className="text-2xl mb-5">Hoạt động gần đây</h1>
          <div className="flex items-center justify-center cursor-pointer h-10 bg-orange-soft hover:bg-orange-semibold font-semibold rounded-lg">
            <p className="px-5 py-1">Xem thêm</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5">
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
        </div>
      </div>
      <div>
        <div className="flex justify-between">
          <h1 className="text-2xl mb-5">Các Squizz</h1>
          <div className="flex items-center justify-center cursor-pointer h-10 bg-orange-soft hover:bg-orange-semibold font-semibold rounded-lg">
            <p className="px-5 py-1">Xem thêm</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-5">
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
          <QuizzCard />
        </div>
      </div>
    </div>
  );
}
