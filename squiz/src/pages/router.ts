import { createBrowserRouter } from "react-router";
import Home from "./Home";
import Dashboard from "./Dashboard";
import Activity from "./Activity";
import MainLayout from "../layout/MainLayout";
import Signin from "./auth/Signin";
import Signup from "./auth/Signup";

const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/dashboard",
    Component: MainLayout,
  },
  {
    path: "/home",
    Component: Dashboard,
  },
  {
    path: "/activity",
    Component: Activity,
  },
  {
    path: "/signin",
    Component: Signin,
  },
  {
    path: "/signup",
    Component: Signup,
  },
]);

export default router;
