import { BellRing, MessageCircle, PercentCircle, PersonStanding, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/users", label: "Users", icon: User },
  { to: "/packages", label: "Plans", icon: PercentCircle },
  { to: "/representatives", label: "Partners", icon: PersonStanding },
  { to: "/inqueries", label: "Inquiries", icon: MessageCircle },
  { to: "/notifications", label: "Alerts", icon: BellRing },
];

const MobileBottomNav = () => {
  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-[60] border-t border-gray-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center gap-0.5 py-2 px-1 min-h-[56px] text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-gray-500 hover:text-primary",
                ].join(" ")
              }
            >
              <Icon size={20} strokeWidth={2} aria-hidden />
              <span className="truncate max-w-full">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
