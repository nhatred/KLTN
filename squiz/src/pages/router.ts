import { createBrowserRouter } from "react-router";
import Home from "./Home";
import Dashboard from "./Dashboard";
import Activity from "./Activity";
import MainLayout from "../layout/MainLayout";
import CreateQuiz from "./CreateQuiz";
import MyQuiz from "./MyQuiz";
import CreatedByMe from "../components/CreatedByMe";
import HostedQuizzes from "../components/HostedQuizzes";
import LikedQuizzes from "../components/LikedQuizzes";
import EditQuiz from "./EditQuiz";

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
    path: "/my-quiz",
    Component: MyQuiz,
  },
  {
    path: "/created-by-me",
    Component: CreatedByMe,
  },
  {
    path: "/hosted-quizzes",
    Component: HostedQuizzes,
  },
  {
    path: "/liked-quizzes",
    Component: LikedQuizzes,
  },
  {
    path: "/create-quiz",
    Component: CreateQuiz,
  },
  {
    path: "/edit-quiz/:id",
    Component: EditQuiz,
  },
]);

export default router;
