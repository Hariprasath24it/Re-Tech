import React from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';
import { Link } from 'react-router-dom';

const DashboardLayout = ({ title, subtitle, children }) => {
  const { user } = useAuth();

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'collector':
        return 'Collector';
      case 'technician':
        return 'Technician';
      case 'admin':
        return 'Administrator';
      default:
        return 'User';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Dark Forest Green Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {title || `Welcome, ${user?.name?.split(' ')[0] || 'Member'} 👋`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {subtitle || "Let's make a cleaner and greener world together."}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationBell />

            {/* User Profile Pill */}
            <Link
              to="/user/profile"
              className="flex items-center space-x-3 pl-3 pr-4 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 transition group"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {getInitials(user?.name)}
              </div>
              <div className="text-left text-xs">
                <span className="font-semibold text-slate-800 block group-hover:text-emerald-800">
                  {user?.name || 'ReTech User'}
                </span>
                <span className="text-[11px] text-slate-500 capitalize">
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            </Link>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="flex-1 p-8 space-y-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
