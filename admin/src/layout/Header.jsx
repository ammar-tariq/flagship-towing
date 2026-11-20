import { BellRing, ChevronDown, LogOut, Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";
import { useSidebar } from "../contexts/SidebarContext";
import { useGetUnreadCountQuery } from "../redux/Apis/Notification";
import { revokeSessionOnServer } from "../redux/baseQueryWithReauth";
import { extractAuthData, resetData } from "../utils/storage";

const Header = () => {
  const navigate = useNavigate();
  const user = extractAuthData("user");
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const { toggleMobile } = useSidebar();

  const { data: unreadRes } = useGetUnreadCountQuery(undefined, {
    pollingInterval: 60_000,
    refetchOnMountOrArgChange: true,
  });
  const unreadCount = Number(unreadRes?.count ?? 0);

  const handleLogout = async () => {
    setOpen(false);
    await revokeSessionOnServer();
    resetData();
    navigate("/login");
  };

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  return (
    <div className="flex items-center justify-between bg-gray-50 py-2 min-h-[56px] lg:h-[75px] px-3 sm:px-6 rounded-2xl lg:rounded-4xl gap-2">
      <button
        type="button"
        className="lg:hidden p-2.5 rounded-xl hover:bg-gray-200/80 text-secondary shrink-0"
        onClick={toggleMobile}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <section className="flex-1 flex items-center justify-end gap-2 sm:gap-4 min-w-0">
        <Link
          to="/notifications"
          className="relative inline-flex p-2 rounded-lg hover:bg-gray-200/80 transition-colors shrink-0"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <BellRing color="black" className="cursor-pointer" size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-600 text-[10px] font-semibold text-white leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="relative min-w-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-200/80 transition-colors cursor-pointer text-left max-w-full"
            aria-expanded={open}
            aria-haspopup="menu"
          >
            <Avatar name={`${user?.first_name} ${user?.last_name}`} />
            <p className="text-secondary text-sm truncate hidden sm:block max-w-[140px] md:max-w-none">
              {user?.first_name} {user?.last_name}
            </p>
            <ChevronDown
              className={`text-black shrink-0 transition-transform hidden sm:block ${open ? "rotate-180" : ""}`}
              size={18}
            />
          </button>
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-[100] mt-2 min-w-[200px] rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-50 cursor-pointer min-h-[44px]"
              >
                <LogOut size={18} className="text-gray-600" />
                Logout
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Header;
