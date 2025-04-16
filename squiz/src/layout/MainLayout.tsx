import { Outlet } from "react-router";
import Navbar from "../components/Navbar.tsx";
export default function MainLayout() {
  return (
    <div className="h-screen">
      <Navbar></Navbar>
      <div className="h-screen container mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
