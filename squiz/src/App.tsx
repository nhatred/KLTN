import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import MainLayout from "./layout/MainLayout";
import CreateQuiz from "./pages/CreateQuiz";
import MyQuiz from "./pages/MyQuiz";
import CreatedByMe from "./components/CreatedByMe";
import HostedQuizzes from "./components/HostedQuizzes";
import LikedQuizzes from "./components/LikedQuizzes";
import EditQuiz from "./pages/EditQuiz";
import JoinQuiz from "./pages/JoinQuiz";
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<MainLayout />}>
            <Route path="home" element={<Dashboard />} />
            <Route path="activity" element={<Activity />} />
            <Route path="my-quiz" element={<MyQuiz />}>
              <Route index element={<Navigate to="created-by-me" replace />} />
              <Route path="created-by-me" element={<CreatedByMe />} />
              <Route path="hosted-quizzes" element={<HostedQuizzes />} />
              <Route path="liked-quizzes" element={<LikedQuizzes />} />
            </Route>
          </Route>
          <Route path="/create-quiz" element={<CreateQuiz />} />
          <Route path="/edit-quiz/:id" element={<EditQuiz />} />
          <Route path="/join-quiz/:id" element={<JoinQuiz />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
