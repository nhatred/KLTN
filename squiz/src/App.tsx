import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import MainLayout from "./layout/MainLayout";
import Signin from "./pages/auth/Signin";
import Signup from "./pages/auth/Signup";
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
          <Route path="/signin" element={<Signin />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
