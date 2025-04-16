import { NavLink } from "react-router";
export default function Home() {
  return (
    <div className="h-screen">
      <nav className="h-16 fixed left-0 right-0  bg-orange-soft border-b-1 border-orange-600 py-2 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-black">Squizz</h1>
        <NavLink to="/dashboard/home">
          <div className="p-3 bg-nude-light btn-hover rounded font-semibold text-lg">
            <p>Trang chủ</p>
          </div>
        </NavLink>
      </nav>
      <div className="flex h-full flex-col justify-center items-center">
        <h1 className="text-8xl mb-16">Squizz</h1>
        <div className="bg-white w-2/5 grid grid-cols-6 justify-between gap-2 border-b-blue-deep rounded-xl border-[1px] border-solid p-2">
          <input
            className="px-2 py-4 text-xl col-span-4"
            type="text"
            placeholder="Nhập mã tham gia"
          />
          <button className="py-2 px-4 col-span-2 text-xl font-bold rounded-xl bg-orange-soft hover:bg-orange-semibold transition-all duration-500">
            Tham gia
          </button>
        </div>
      </div>
      <div className="fixed bg-orange-soft border-t-1 border-blue-deep left-0 right-0 bottom-0">
        Footer
      </div>
    </div>
  );
}
