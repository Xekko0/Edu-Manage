/**
 * AppShell — Global App Shell mới (3 zones).
 * Left: CollapsibleSidebar. Top: TopBar. Center: Main Workspace.
 */
import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import CollapsibleSidebar from './CollapsibleSidebar';
import TopBar from './TopBar';
import StudentContextBar from './StudentContextBar';
import { SchoolYearProvider } from '../../contexts/SchoolYearContext';

export default function AppShell() {
  const { user, refreshProfile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const isFamily = ['parent', 'student'].includes(user?.role);

  useEffect(() => {
    if (!user) return;
    const needsCaps = ['admin', 'subject', 'homeroom'].includes(user.role) && !user.capabilities;
    if (needsCaps) refreshProfile();
  }, [user?.id, user?.role, user?.capabilities]);

  return (
    <SchoolYearProvider>
      <div className="min-h-screen bg-surface">
        <CollapsibleSidebar
          user={user}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onExpandChange={setSidebarExpanded}
        />

        <div className={`transition-all duration-300 ${sidebarExpanded ? 'lg:pl-56' : 'lg:pl-16'}`}>
          <TopBar onMenuClick={() => setSidebarOpen(true)} />

          {isFamily && <StudentContextBar />}

          <main className="px-4 py-5 sm:px-5 lg:px-7 lg:py-6 max-w-[1520px] mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SchoolYearProvider>
  );
}
