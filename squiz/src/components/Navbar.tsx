import { NavLink } from "react-router";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  Clock04Icon,
  Cards02Icon,
  SearchSquareIcon,
  SearchAreaIcon,
  Add01Icon,
  AirplayLineIcon,
  Book01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState } from "react";
import SelectQuizModal from "./SelectQuizModal";
import SelectQuizForRoomModal from "./SelectQuizForRoomModal";

export default function Navbar() {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const [isSelectQuizModalOpen, setIsSelectQuizModalOpen] = useState(false);

  const [lastScrollY, setLastScrollY] = useState(0);
  const [visible, setVisible] = useState(true);
  const [showShadow, setShowShadow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Ẩn nav khi cuộn xuống
      if (currentScrollY > lastScrollY && currentScrollY > 10) {
        setVisible(false);
        setShowShadow(false);
      }
      // Hiện nav + bóng khi cuộn lên (trừ khi ở đầu trang)
      else if (currentScrollY < lastScrollY && currentScrollY > 10) {
        setVisible(true);
        setShowShadow(true);
      }
      // Ở đầu trang: hiện nav nhưng không bóng
      else if (currentScrollY <= 10) {
        setVisible(true);
        setShowShadow(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`h-16 fixed z-50 bg-background left-0 right-0 py-2 px-8 flex justify-between items-center transition-all duration-300 ${
          visible ? "translate-y-0" : "-translate-y-full"
        } ${showShadow ? "shadow-md" : "shadow-none"}`}
      >
        <div className="flex items-center gap-5">
          <NavLink to="/">
            <h1 className="text-3xl font-black">Squizz</h1>
          </NavLink>
          <form className="w-80">
            <label
              htmlFor="default-search"
              className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-gray-300"
            >
              Search
            </label>
            <div className=" flex border-orange rounded-lg border-1">
              <div className="flex inset-y-0 items-center pl-2 pointer-events-none">
                <HugeiconsIcon icon={SearchAreaIcon} />
              </div>
              <input
                type="search"
                id="default-search"
                className="block p-2 w-full text-sm "
                placeholder="Tìm Squiz..."
                required
              />
              <button
                type="submit"
                className="bg-orange font-medium rounded-e-lg p-2"
              >
                <HugeiconsIcon icon={SearchSquareIcon} size={26} />
              </button>
            </div>
          </form>
          <NavLink
            to="/dashboard/home"
            className={({ isActive }) =>
              `flex h-12 items-center gap-2 px-3 font-bold text-xl btn-hover ${
                isActive ? "btn-active text-orange" : ""
              }`
            }
          >
            <HugeiconsIcon icon={Home01Icon} />
            <p>Trang chủ</p>
          </NavLink>

          {user && (
            <NavLink
              to="/dashboard/activity"
              className={({ isActive }) =>
                `flex h-12 items-center gap-2 px-3 font-bold text-xl btn-hover ${
                  isActive ? "btn-active text-orange" : ""
                }`
              }
            >
              <HugeiconsIcon icon={Clock04Icon} />
              <p>Hoạt động</p>
            </NavLink>
          )}
          {user && (
            <NavLink
              to="/dashboard/my-quiz/"
              className={({ isActive }) =>
                `flex h-12 items-center gap-2 px-3 font-bold text-xl btn-hover ${
                  isActive ? "btn-active text-orange" : ""
                }`
              }
            >
              <HugeiconsIcon icon={Cards02Icon} />
              <p>Quiz của bạn</p>
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/dashboard/room-manager/"
              className={({ isActive }) =>
                `flex h-12 items-center gap-2 px-3 font-bold text-xl btn-hover ${
                  isActive ? "btn-active text-orange" : ""
                }`
              }
            >
              <HugeiconsIcon icon={AirplayLineIcon} />
              <p>Quản lý phòng thi</p>
            </NavLink>
          )}

          {user && (
            <NavLink
              to="/dashboard/exam-bank/"
              className={({ isActive }) =>
                `flex h-12 items-center gap-2 px-3 font-bold text-xl btn-hover ${
                  isActive ? "btn-active text-orange" : ""
                }`
              }
            >
              <HugeiconsIcon icon={Book01Icon} />
              <p>Ngân hàng đề thi</p>
            </NavLink>
          )}
        </div>
        <div className="flex items-center gap-5">
          {user && (
            <button
              onClick={() => setIsSelectQuizModalOpen(true)}
              className="flex bg-gray-100 btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg"
            >
              <HugeiconsIcon icon={Add01Icon} size={20} />
              <p>Tạo phòng</p>
            </button>
          )}
          {user && (
            <NavLink
              to="/create-quiz"
              className="flex bg-orange btn-hover items-center gap-2 py-2 px-3 rounded font-semibold text-lg"
            >
              <HugeiconsIcon icon={Add01Icon} size={20} />
              <p>Tạo một Squiz</p>
            </NavLink>
          )}
          {user ? (
            <UserButton />
          ) : (
            <div onClick={() => openSignIn()}>
              <div className="p-3 cursor-pointer bg-orange btn-hover rounded font-semibold text-lg">
                <p>Đăng nhập</p>
              </div>
            </div>
          )}
        </div>
      </nav>

      <SelectQuizForRoomModal
        isOpen={isSelectQuizModalOpen}
        onClose={() => setIsSelectQuizModalOpen(false)}
      />
    </>
  );
}
