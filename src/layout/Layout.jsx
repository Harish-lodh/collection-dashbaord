import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

const Layout = ({ role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-1">
        <div
          className={`
            fixed top-16 bottom-0 left-0
            w-64 sm:w-66 bg-white
            border-r border-gray-200
            z-40 transition-transform duration-300
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
        >
        <Sidebar/>
        </div>
        <main
          className={`
            flex-1 pt-6
            transition-all duration-300
            lg:ml-30 sm:ml-0
            ${isSidebarOpen ? "ml-64 sm:ml-80" : "ml-0"}
          `}
        >
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;