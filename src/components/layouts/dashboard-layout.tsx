import { Home, PanelLeft, Users, Sparkles, Search, Settings, Sun, User2, MessageSquare, Calendar, CheckSquare, HelpCircle, FileText, LogOut, ChevronDown, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useNavigation, useLocation } from 'react-router';

import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useNotifications } from '@/components/ui/notifications';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';
import { cn } from '@/utils/cn';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown';
import { Link } from '../ui/link';

type SideNavigationItem = {
  name: string;
  to: string;
  icon: (props: React.SVGProps<SVGSVGElement>) => JSX.Element;
};

const Logo = ({ collapsed = false }: { collapsed?: boolean }) => {
  return (
    <Link className="flex items-center gap-2 text-slate-900 transition-transform hover:opacity-80 px-2" to={paths.home.getHref()}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-[#0EA5E9] shadow-md shadow-blue-500/10 shrink-0">
        <Sparkles className="size-4.5 text-white" />
      </div>
      {!collapsed && (
        <span className="text-xl font-extrabold tracking-tight text-[#1E3A8A] lg:inline hidden">
          Task<span className="text-[#0EA5E9]">Flow</span>
        </span>
      )}
    </Link>
  );
};

const Progress = () => {
  const { state, location } = useNavigation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [location?.pathname]);

  useEffect(() => {
    if (state === 'loading') {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(timer);
            return 100;
          }
          const newProgress = oldProgress + 10;
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 300);

      return () => {
        clearInterval(timer);
      };
    }
  }, [state]);

  if (state !== 'loading') {
    return null;
  }

  return (
    <div
      className="fixed left-0 top-0 h-1 bg-[#0EA5E9] transition-all duration-200 ease-in-out z-50"
      style={{ width: `${progress}%` }}
    ></div>
  );
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useUser();
  const { addNotification } = useNotifications();
  const logout = useLogout({
    onSuccess: () => navigate(paths.auth.login.getHref(location.pathname)),
  });

  const userRole = user.data?.role;
  const isEmployee = userRole === 4 || userRole === 'Employee';
  const isManagerOrAbove = userRole === 0 || userRole === 1 || userRole === 2 || userRole === 'CEO' || userRole === 'Manager' || userRole === 'Team Lead';

  const actualRoleString = (() => {
    if (userRole === 0 || userRole === 'CEO') return 'CEO';
    if (userRole === 1 || userRole === 'Manager') return 'Manager';
    if (userRole === 2 || userRole === 'Team Lead') return 'Team Lead';
    if (userRole === 4 || userRole === 'Employee') return 'Employee';
    return 'User';
  })();

  const navigation = [
    { name: 'Dashboard', to: paths.app.dashboard.getHref(), icon: Home },
    {
      name: isEmployee ? 'My Tasks' : 'Tasks',
      to: paths.app.tasks.getHref(),
      icon: CheckSquare
    },
    !isEmployee && { name: 'Teams', to: paths.app.teams.getHref(), icon: Users },
    isManagerOrAbove && { name: 'Reports', to: paths.app.reports.getHref(), icon: FileText },
    { name: 'Profile/Settings', to: paths.app.profile.getHref(), icon: Settings },
  ].filter(Boolean) as SideNavigationItem[];

  return (
    <div className="flex min-h-screen w-full bg-[#F5F6FA] font-sans antialiased">
      <Progress />

      {/* Sidebar (Desktop & Tablet) */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden flex-col bg-white border-r border-slate-100 shadow-sm sm:flex sm:w-20 lg:w-60 transition-all duration-300">
        <div className="flex h-20 shrink-0 items-center justify-center lg:justify-start lg:px-6">
          <Logo collapsed={false} />
        </div>

        <nav className="flex flex-col gap-2 px-3 flex-1 mt-6">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              end={item.to === '/app' || item.to === '/app/'}
              onClick={(e) => {
                if (item.to.startsWith('#')) {
                  e.preventDefault();
                  addNotification({ type: 'info', title: item.name, message: `${item.name} module is active.` });
                }
              }}
              className={({ isActive }) =>
                cn(
                  'group flex items-center justify-center lg:justify-start rounded-xl p-3 lg:px-4 lg:py-3.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-[#1E3A8A] text-white shadow-md shadow-blue-900/15'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                )
              }
            >
              <item.icon
                className="size-5 shrink-0 lg:mr-3.5"
                aria-hidden="true"
              />
              <span className="hidden lg:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer Logout (at bottom) */}
        <div className="px-3 pb-6 mt-auto">
          <button
            onClick={() => logout.mutate({})}
            className="group flex w-full items-center justify-center lg:justify-start rounded-xl p-3 lg:px-4 lg:py-3.5 text-sm font-bold text-rose-600 hover:bg-rose-50/50 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="size-5 shrink-0 lg:mr-3.5" />
            <span className="hidden lg:inline">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex w-full flex-col sm:pl-20 lg:pl-60 transition-all duration-300">

        {/* Top Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 px-4 sm:px-8 bg-[#F5F6FA]/90 backdrop-blur-md border-b border-slate-100">

          {/* Mobile Menu Trigger */}
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon" variant="ghost" className="sm:hidden text-slate-500 hover:bg-slate-100 rounded-xl">
                <PanelLeft className="size-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent side="left" className="bg-white pt-10 text-slate-950 sm:max-w-60 border-r-0">
              <nav className="grid gap-3 px-4 text-base font-semibold">
                <div className="flex h-16 shrink-0 items-center mb-6">
                  <Logo />
                </div>
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    end={item.to === '/app' || item.to === '/app/'}
                    onClick={(e) => {
                      if (item.to.startsWith('#')) {
                        e.preventDefault();
                        addNotification({ type: 'info', title: item.name, message: `${item.name} module is active.` });
                      }
                    }}
                    className={({ isActive }) =>
                      cn(
                        'group flex w-full items-center rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                        isActive ? 'bg-[#1E3A8A] text-white' : 'text-slate-600 hover:bg-slate-50'
                      )
                    }
                  >
                    <item.icon className="mr-3.5 size-5 shrink-0" aria-hidden="true" />
                    {item.name}
                  </NavLink>
                ))}
                <div className="mt-8 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => logout.mutate({})}
                    className="flex w-full items-center rounded-xl px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50/50"
                  >
                    <LogOut className="mr-3.5 size-5 shrink-0" />
                    Logout
                  </button>
                </div>
              </nav>
            </DrawerContent>
          </Drawer>

          {/* Left page title / search bar */}
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-extrabold text-slate-800 hidden md:block">
              {isEmployee ? 'My Dashboard' : 'Dashboard'}
            </h2>
            <div className="hidden sm:flex items-center gap-2 bg-white rounded-xl px-3.5 py-2 border border-slate-200/50 shadow-sm w-64 focus-within:border-[#1E3A8A] transition-all">
              <Search className="size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, teams..."
                className="text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-full bg-transparent font-medium"
              />
            </div>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3 ml-auto">



            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl hover:bg-white p-1 pr-3 border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex size-9.5 items-center justify-center rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 overflow-hidden shrink-0">
                    <User2 className="size-5 text-[#0EA5E9]" />
                  </div>
                  <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-sm font-bold text-slate-900 leading-tight">
                      {user.data?.firstName} {user.data?.lastName}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold mt-0.5 uppercase tracking-wide ${actualRoleString === 'CEO'
                      ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]'
                      : actualRoleString === 'Manager' || actualRoleString === 'Team Lead'
                        ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]'
                        : 'bg-emerald-50/15 text-emerald-600'
                      }`}>
                      {actualRoleString}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-xl border-slate-100 py-1 z-30">

                <DropdownMenuItem
                  onClick={() => navigate(paths.app.profile.getHref())}
                  className="cursor-pointer font-semibold py-2.5 text-slate-700 focus:bg-slate-50"
                >
                  Your Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer font-bold py-2.5 text-rose-600 focus:text-rose-600 focus:bg-rose-50/50"
                  onClick={() => logout.mutate({})}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/40 bg-[#F5F6FA] py-6 px-4 sm:px-8 text-center text-xs font-bold text-slate-400">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="tracking-tight">
              &copy; {new Date().getFullYear()} TaskFlow B2B Portal. All rights reserved.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
