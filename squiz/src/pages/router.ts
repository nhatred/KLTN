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
import JoinQuiz from "./JoinQuiz";
import CreateRoom from "./CreateRoom";
import JoinRoom from "./JoinRoom";
import RoomManager from "./RoomManager";
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
  {
    path: "/join-quiz/:id",
    Component: JoinQuiz,
  },
  {
    path: "/create-room/:id",
    Component: CreateRoom,
  },
  {
    path: "/join-room/:id",
    Component: JoinRoom,
  },
  {
    path: "/room-manager",
    Component: RoomManager,
  },
]);

export default router;
