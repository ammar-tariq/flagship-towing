import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileBottomNav from "../components/MobileBottomNav";
import { SidebarProvider } from "../contexts/SidebarContext";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <SidebarProvider>
      <div className="h-[100dvh] flex flex-col bg-white">
        <Sidebar />
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <main className="relative z-10 flex min-w-0 flex-1 min-h-0 flex-col lg:ml-[320px] p-3 sm:p-5 lg:p-7 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-7">
            <header className="relative z-50 shrink-0">
              <Header />
            </header>
            <div className="mt-4 lg:mt-7 min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl lg:rounded-2xl bg-white">
              <div className="p-3 sm:p-4 lg:p-6 min-h-full">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
