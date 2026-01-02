import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MapIcon from "@mui/icons-material/Map";
import PaymentsIcon from "@mui/icons-material/Payments";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import PeopleIcon from "@mui/icons-material/People";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
// import { jwtDecode } from "jwt-decode";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [openSection, setOpenSection] = useState(null); // track open parent

useEffect(() => {
  const role = localStorage.getItem("role");

  if (role) {
    setIsSuperAdmin(role.toLowerCase() === "superadmin");
  } else {
    setIsSuperAdmin(false);
  }
}, []);


  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  const toggleSection = (label) => {
    setOpenSection(openSection === label ? null : label);
  };

  const collectionRoute =isSuperAdmin ? "/collections" :"/collection/list"

  const menuSections = [
    {
      label: "Dashboard",
      icon: DashboardIcon,
      path: "/dashboard",
    },

    {
      label: "Collections",
      icon: PaymentsIcon,
      children: [
        { label: "Collections", path: collectionRoute },
        // { label: "Pending Approvals", path: "/payments/pending" },
      ],
    },
    {
      label: "Repossession",
      icon: CameraAltIcon,
      children: [
        { label: "Repo Cases", path: "/repossession" },
        // { label: "Photos", path: "/repossession/photos" },
      ],
    },
    // {
    //   label: "Users",
    //   icon: PeopleIcon,
    //   children: [
    //     { label: "RM / Collectors", path: "/users/rm" },
    //     { label: "Dealers", path: "/users/dealers" },
    //   ],
    // },
        {
      label: "Field Tracking",
      icon: MapIcon,
      children: [
        { label: "RM / Collectors", path: "/users/rm" },
         { label: "Dealers", path: "/users/dealers" },
         {label:"track collectors",path:"/users/map"}
      ],
    },
    {
      label: "Reports",
      icon: BarChartIcon,
      children: [
        { label: "Daily Summary", path: "/reports/daily" },
        // { label: "Performance", path: "/reports/performance" },
      ],
    },
    // {
    //   label: "Settings",
    //   icon: SettingsIcon,
    //   path: "/settings",
    // },
  ];

  return (
    <aside className="flex flex-col h-full bg-white border-r border-gray-200">
      <nav className="flex-1 overflow-y-auto p-3 text-sm sm:text-base">
        {menuSections.map((section) => {
          const isOpen = openSection === section.label;
          const Icon = section.icon;

          // No children = simple nav
          if (!section.children) {
            return (
              <NavLink
                key={section.label}
                to={section.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 w-full p-2 rounded-lg transition-all 
                   ${isActive
                     ? "text-blue-800 font-semibold bg-blue-50"
                     : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"}`
                }
              >
                <Icon fontSize="small" />
                <span>{section.label}</span>
              </NavLink>
            );
          }

          // Parent with children
          return (
            <div key={section.label} className="mb-2">
              <button
                onClick={() => toggleSection(section.label)}
                className={`flex items-center justify-between w-full p-2 rounded-lg font-semibold transition-all 
                ${
                  isOpen
                    ? "text-blue-800 bg-blue-50"
                    : "text-gray-700 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon fontSize="small" />
                  {section.label}
                </span>
                <ArrowDropDownIcon
                  fontSize="small"
                  className={`transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Collapsible content */}
              {isOpen && (
                <div className="mt-1">
                  {section.children.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center w-full p-2 pl-8 rounded-lg transition-all hover:bg-blue-50 ${
                          isActive
                            ? "text-blue-800 font-semibold bg-blue-50"
                            : "text-gray-700 hover:text-blue-700"
                        }`
                      }
                    >
                      <ChevronRightIcon className="mr-2" fontSize="small" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}



        <hr className="my-4 border-gray-200" />

        <button
          onClick={handleLogout}
          className="flex items-center w-full p-2 rounded-lg transition-all hover:bg-blue-50 text-gray-700 hover:text-blue-700"
        >
          <LogoutIcon className="mr-3" fontSize="small" />
          Log Out
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
