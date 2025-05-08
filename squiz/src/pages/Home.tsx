import { NavLink } from "react-router";
import "../style/home.css";

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      {/* Navbar */}
      <nav className="pt-4 px-8 flex justify-between items-center">
        <h1 className="text-3xl font-black">Squizz</h1>
        <NavLink to="/dashboard/home">
          <div className="p-3 bg-orange btn-hover rounded font-semibold text-lg">
            <p>Trang chủ</p>
          </div>
        </NavLink>
      </nav>

      <div className="flex-1 mx-8 relative">
        <div className="absolute inset-0 rounded-2xl flex justify-center items-center mb-8 mt-4">
          <img
            className="rounded-2xl w-full h-full object-cover"
            src="/assets/background.avif"
            alt="Background"
          />
          <div className="noise is-hero rounded-2xl"></div>
          <div className="dark_gradient rounded-2xl"></div>
        </div>

        <div className="px-8 relative z-10 h-full flex flex-col justify-end">
          <div className="flex items-center justify-between gap-60">
            <h1 className="text-[200px] font-black text-orange text-left">
              SQUIZZ
            </h1>
            <div className=" text-background">
              <div className=" bg-background mb-2 grid grid-cols-6 justify-between gap-2 border-b-blue-deep rounded-xl border-[1px] border-solid p-2">
                <input
                  className="px-2 py-4 text-xl col-span-4"
                  type="text"
                  placeholder="Nhập mã tham gia"
                />
                <button className="py-2  px-4 col-span-2 text-xl font-bold rounded-xl bg-orange hover:bg-orange-semibold transition-all duration-500">
                  Tham gia
                </button>
              </div>
              <p className="text-xl font-semibold">
                Join us in transforming dreams into reality. Your support can
                make a significant impact on the causes that matter most.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
