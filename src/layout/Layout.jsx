import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useState } from "react";

const SIDEBAR_PX = 260; // keep this in sync with the arbitrary classes below

const Layout = ({ role }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  return (
    // On lg+, reserve space for the fixed sidebar with padding-left
    <div className="flex flex-col min-h-screen lg:pl-[120px]">
      <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />

      <div className="flex flex-1">
        {/* Mobile overlay (only visible when sidebar is open on <lg) */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar: off-canvas on mobile, fixed rail on lg+ */}
        <aside
          className={[
            "fixed z-40 top-16 bottom-0 left-0",
            "w-[260px] bg-white border-r border-gray-200",
            "transition-transform duration-300",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full",
            "lg:translate-x-0" // always shown on large screens
          ].join(" ")}
          aria-hidden={!isSidebarOpen && typeof window !== "undefined" && window.innerWidth < 1024}
        >
          <Sidebar />
        </aside>

        {/* Main content */}
        <main
          className={[
            "flex-1  mt-6",        // prevent overflow and weird shrinking
            "pt-6",                  // space below header
            "transition-[padding] duration-300",
            "px-4 sm:px-4 lg:px-6"   // content padding
          ].join(" ")}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
