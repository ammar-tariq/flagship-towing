import {
  ChevronDown,
  ChevronRight,
  MessageCircle,
  PercentCircle,
  PersonStanding,
  Settings2,
  ScrollText,
  User,
  UserX,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { images } from "../assets";
import { useSidebar } from "../contexts/SidebarContext";
import { isSuperAdminUser } from "../utils/auth";

const membershipsMenu = [
  {
    icon: <User size={20} />,
    label: "User Management",
    route: "users",
  },
  {
    icon: <UserPlus size={20} />,
    label: "Authorized User Requests",
    route: "authorized-user-requests",
  },
  {
    icon: <PercentCircle size={20} />,
    label: "Membership Management",
    route: "packages",
  },
  {
    icon: <PersonStanding size={20} />,
    label: "Partner Management",
    route: "representatives",
  },
  {
    icon: <MessageCircle size={20} />,
    label: "User Inquiries",
    route: "inqueries",
  },
];

const Sidebar = () => {
  const [expandedIdx, setExpandedIdx] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { mobileOpen, closeMobile } = useSidebar();
  const showSuperSettings = isSuperAdminUser();

  const isActiveRoute = (route) =>
    !location.pathname.includes("coming-soon") && location.pathname.includes(route);

  const handleNavigate = (path) => {
    navigate(path);
    closeMobile();
  };

  const handleMenuClick = (idx, route, hasChildren) => {
    if (hasChildren) {
      setExpandedIdx(expandedIdx === idx ? null : idx);
    } else {
      handleNavigate(`/${route}`);
    }
  };

  const handleSubItemClick = (route) => {
    handleNavigate(`/${route}`);
  };

  const navContent = (
    <>
      <section className="flex items-center justify-between gap-3 p-4 lg:p-7">
        <div
          className="flex flex-1 border-b border-gray-200 pb-4 cursor-pointer"
          onClick={() => handleNavigate("/users")}
        >
          <img src={images.logo} className="w-full max-h-12 object-contain" alt="Flagship Towing" />
        </div>
        <button
          type="button"
          className="lg:hidden p-2 rounded-lg hover:bg-gray-200 text-secondary"
          onClick={closeMobile}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </section>
      <div className="flex flex-col pb-6">
        <div className="px-4 lg:px-6 pt-2 pb-1">
          <p className="text-xs font-semibold tracking-widest text-gray-500">MEMBERSHIPS</p>
          <div className="mt-2 h-px w-full bg-gray-200" aria-hidden />
        </div>
        {membershipsMenu.map((item, idx) => {
          const hasChildren = Array.isArray(item.children);
          const isExpanded = expandedIdx === idx;
          const isMainActive = !hasChildren && isActiveRoute(item.route);
          const isAnyChildActive =
            hasChildren && item.children?.some((child) => isActiveRoute(child.route));

          return (
            <div key={idx} className="w-full pr-2 lg:pr-4">
              <div
                onClick={() => handleMenuClick(idx, item.route, hasChildren)}
                className={`flex justify-between items-center gap-2 px-4 lg:px-6 py-3.5 lg:py-4 text-sm cursor-pointer transition-all rounded-tr-2xl rounded-br-2xl min-h-[48px]
                ${
                  isMainActive || isAnyChildActive
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10 text-secondary border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {hasChildren && (
                  <span className="shrink-0">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>
                )}
              </div>

              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50
                ${isExpanded ? "max-h-60 py-2" : "max-h-0 py-0"}`}
              >
                {hasChildren &&
                  item.children.map((child, childIdx) => {
                    const isChildActive = isActiveRoute(child.route);
                    return (
                      <div
                        key={childIdx}
                        onClick={() => handleSubItemClick(child.route)}
                        className={`pl-10 lg:pl-12 pr-4 py-2.5 text-xs cursor-pointer transition-colors min-h-[44px] flex items-center
                          ${
                            isChildActive
                              ? "text-primary font-medium"
                              : "text-gray-600 hover:text-primary"
                          }`}
                      >
                        {child.label}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
        {showSuperSettings && (
          <>
            <div className="px-4 lg:px-6 pt-4 pb-1">
              <p className="text-xs font-semibold tracking-widest text-gray-500">SUPER</p>
              <div className="mt-2 h-px w-full bg-gray-200" aria-hidden />
            </div>
            <div className="w-full pr-2 lg:pr-4">
              <div
                onClick={() => handleNavigate("/super-settings")}
                className={`flex justify-between items-center gap-2 px-4 lg:px-6 py-3.5 lg:py-4 text-sm cursor-pointer transition-all rounded-tr-2xl rounded-br-2xl min-h-[48px]
                ${
                  isActiveRoute("super-settings")
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10 text-secondary border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <span className="shrink-0">
                    <Settings2 size={20} />
                  </span>
                  <span className="truncate">Super settings</span>
                </div>
              </div>
            </div>
            <div className="w-full pr-2 lg:pr-4">
              <div
                onClick={() => handleNavigate("/activity-logs")}
                className={`flex justify-between items-center gap-2 px-4 lg:px-6 py-3.5 lg:py-4 text-sm cursor-pointer transition-all rounded-tr-2xl rounded-br-2xl min-h-[48px]
                ${
                  isActiveRoute("activity-logs")
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10 text-secondary border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <span className="shrink-0">
                    <ScrollText size={20} />
                  </span>
                  <span className="truncate">Activity logs</span>
                </div>
              </div>
            </div>
            <div className="w-full pr-2 lg:pr-4">
              <div
                onClick={() => handleNavigate("/deleted-accounts")}
                className={`flex justify-between items-center gap-2 px-4 lg:px-6 py-3.5 lg:py-4 text-sm cursor-pointer transition-all rounded-tr-2xl rounded-br-2xl min-h-[48px]
                ${
                  isActiveRoute("deleted-accounts")
                    ? "bg-primary text-white"
                    : "hover:bg-primary/10 text-secondary border-l-4 border-transparent"
                }`}
              >
                <div className="flex items-center gap-3 w-full min-w-0">
                  <span className="shrink-0">
                    <UserX size={20} />
                  </span>
                  <span className="truncate">Deleted accounts</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobile}
        aria-hidden={!mobileOpen}
      />
      <aside
        className={`fixed left-0 top-0 z-[80] h-full w-[min(320px,88vw)] bg-gray-50 overflow-y-auto shadow-xl transition-transform duration-300 ease-out lg:translate-x-0 lg:shadow-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Sidebar navigation"
      >
        {navContent}
      </aside>
      <div className="hidden lg:block fixed left-0 top-0 h-full w-[320px] pointer-events-none" aria-hidden />
    </>
  );
};

export default Sidebar;
