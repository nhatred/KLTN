import { NavLink, Outlet } from "react-router";
export default function MainLayout() {
  return (
    <div className="h-screen">
      <nav className="h-16 fixed left-0 right-0 border-b-1 border-orange-600 bg-orange-soft py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <h1 className="text-3xl font-black">Squizz</h1>
          <form className="w-80">
            <label
              htmlFor="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300"
            >
              Search
            </label>
            <div className="relative">
              <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-500 dark:text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="search"
                id="default-search"
                className="block p-4 pl-10 w-full text-sm rounded-lg border border-gray-300 focus:ring-blue-deep focus:border-blue-deep  "
                placeholder="Tìm Quizz..."
                required
              />
              <button
                type="submit"
                className=" absolute right-2.5 bottom-2.5 bg-orange-soft hover:bg-orange-semibold focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 "
              >
                Tìm kiếm
              </button>
            </div>
          </form>
          <NavLink
            to="/dashboard/home"
            className={({ isActive }) =>
              `flex h-16 items-center gap-2 p-3 font-semibold text-lg ${
                isActive ? "text-orange-800 border-b-4 border-orange-800" : ""
              }`
            }
          >
            <i className="text-xl fa-solid fa-house-fire"></i>
            <p>Trang chủ</p>
          </NavLink>

          <NavLink
            to="/dashboard/activity"
            className={({ isActive }) =>
              `flex h-16 items-center gap-2 p-3 font-semibold text-lg ${
                isActive ? "text-orange-800 border-b-4 border-orange-800" : ""
              }`
            }
          >
            <i className="text-xl fa-regular fa-clock"></i>
            <p>Hoạt động</p>
          </NavLink>
        </div>
        <div className="flex items-center gap-2">
          <NavLink to="/signin">
            <div className="p-3 bg-nude-semibold btn-hover rounded font-semibold text-lg">
              <p>Đăng nhập</p>
            </div>
          </NavLink>
          <NavLink to="/signup">
            <div className="p-3 bg-nude-semibold btn-hover rounded font-semibold text-lg">
              <p>Đăng kí</p>
            </div>
          </NavLink>
        </div>
      </nav>
      <div className="h-screen container mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
