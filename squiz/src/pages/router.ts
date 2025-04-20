import { createBrowserRouter } from "react-router";
import Home from "./Home";
import Dashboard from "./Dashboard";
import Activity from "./Activity";
import MainLayout from "../layout/MainLayout";
import CreateQuiz from "./CreateQuiz";
import MultipleChoices from "./quiz/MultipleChoices";
import FillInBlank from "./quiz/FillInBlank";
import Paragraph from "./quiz/Paragraph";
import DragAndDrop from "./quiz/DragAndDrop";
import Dropdown from "./quiz/Dropdown";

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
    path: "/create-quiz",
    Component: CreateQuiz,
  },
  {
    path: "/multiple-choices",
    Component: MultipleChoices,
  },
  {
    path: "/fill-inblank",
    Component: FillInBlank,
  },
  {
    path: "/paragraph",
    Component: Paragraph,
  },
  {
    path: "/drag-drop",
    Component: DragAndDrop,
  },
  {
    path: "/dropdown",
    Component: Dropdown,
  },
]);

export default router;
