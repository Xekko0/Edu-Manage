import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SidebarDesktop from './SidebarDesktop';
import TopBar from './TopBar';
import StudentContextBar from './StudentContextBar';
import { SchoolYearProvider } from '../../contexts/SchoolYearContext';
import useAuth from '../../hooks/useAuth';

export default function AppShell() {
  const { user, refreshProfile } = useAuth();
  const location = useLocation();
  const isFamily = ['parent', 'student'].includes(user?.role);

  useEffect(() => {
    if (!user) return;
    const needsCaps = ['admin', 'subject', 'homeroom'].includes(user.role) && !user.capabilities;
    if (needsCaps) refreshProfile();
  }, [user?.id, user?.role, user?.capabilities]);

  return (
    <SchoolYearProvider>
      <div className="min-h-screen flex bg-surface">
        <SidebarDesktop user={user} />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
            {isFamily && <StudentContextBar />}
            <Outlet />
          </main>
        </div>
      </div>
    </SchoolYearProvider>
  );
}
