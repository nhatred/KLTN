import { NavLink } from "react-router";
export default function Signup() {
  return (
    <div>
      <nav className="h-16 fixed left-0 right-0 border-b-1 border-orange-600 bg-orange-soft py-2 px-4 flex justify-between items-center">
        <div className="flex items-center gap-5">
          <h1 className="text-3xl font-black">Squizz</h1>
        </div>
        <div className="flex items-center gap-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex h-16 items-center gap-2 p-3 font-semibold text-lg ${
                isActive ? "text-orange-800 border-b-4 border-orange-800" : ""
              }`
            }
          >
            <p>Join a game</p>
          </NavLink>
          <NavLink to="/signin">
            <div className="p-3 bg-nude-semibold btn-hover rounded font-semibold text-lg">
              <p>Sign In</p>
            </div>
          </NavLink>
        </div>
      </nav>
      <div className=" h-screen bg-nude-light grid grid-cols-5 items-center justify-center">
        <div className="col-span-1"></div>
        <div className=" col-span-3  box-shadow grid grid-cols-5">
          <div className="p-12 bg-white rounded-s-xl col-span-3">
            <h3 className="text-xl">Squiz</h3>
            <h1 className="text-5xl py-4">Sign up</h1>
            <div>
              <div className="mb-4">
                <label htmlFor="email" className="block mb-1 font-semibold">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  className="w-full border-1 rounded-md py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="name" className="block mb-1 font-semibold">
                  Name
                </label>
                <input
                  type="name"
                  id="name"
                  name="name"
                  placeholder="Enter your name"
                  className="w-full border-1 rounded-md py-2 px-3"
                />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block mb-1 font-semibold">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  className="w-full border-1 rounded-md py-2 px-3"
                />
              </div>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-2 w-full">
              <button className="py-2 font-semibold px-5 w-full col-span-2 hover:bg-orange-semibold rounded bg-orange-soft">
                Sign up
              </button>
              <NavLink to="/signin">
                <button className="py-2 font-semibold px-5 w-full hover:bg-blue-deep hover:text-white rounded bg-white border-1">
                  Sign in
                </button>
              </NavLink>
            </div>
            <div>
              <div className="flex gap-2 justify-center p-2 rounded mt-2 hover:bg-blue-deep hover:text-white transition-all duration-200 cursor-pointer items-center w-full border-1 ">
                <i className="text-2xl fa-brands fa-google"></i>
                <p className="font-semibold">Sign up with Google</p>
              </div>
            </div>
          </div>
          <img
            className=" col-span-2 rounded-e-xl"
            src="/assets/login-bg.jpg"
            alt=""
          />
        </div>
      </div>
    </div>
  );
}
