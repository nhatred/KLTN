import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import MainLayout from "./layout/MainLayout";
import CreateQuiz from "./pages/CreateQuiz";
function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<MainLayout />}>
            <Route path="home" element={<Dashboard />} />
            <Route path="activity" element={<Activity />} />
          </Route>
          <Route path="/create-quiz" element={<CreateQuiz />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
