import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf,
  LayoutDashboard,
  Smartphone,
  PlusCircle,
  Truck,
  Search,
  Award,
  User,
  LogOut,
  Wrench,
  Recycle,
  Users,
  BarChart3,
  ClipboardList,
  CheckCircle,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.role || 'user';

  const userLinks = [
    { to: '/user/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/user/devices', label: 'My Devices', icon: Smartphone },
    { to: '/user/add-device', label: 'Add Device', icon: PlusCircle },
    { to: '/user/pickup', label: 'Request Pickup', icon: Truck },
    { to: '/user/track', label: 'Track Device', icon: Search },
    { to: '/user/rewards', label: 'Rewards', icon: Award },
    { to: '/user/profile', label: 'Profile', icon: User },
  ];

  const collectorLinks = [
    { to: '/collector/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/collector/requests', label: 'Pickup Requests', icon: Truck },
    { to: '/collector/assigned', label: 'Assigned Pickups', icon: ClipboardList },
    { to: '/collector/completed', label: 'Completed Pickups', icon: CheckCircle },
    { to: '/user/profile', label: 'Profile', icon: User },
  ];

  const technicianLinks = [
    { to: '/technician/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/technician/pending', label: 'Pending Devices', icon: Smartphone },
    { to: '/technician/inspection/records', label: 'Inspection', icon: ShieldCheck },
    { to: '/technician/repairs', label: 'Under Repair', icon: Wrench },
    { to: '/technician/completed', label: 'Completed', icon: PackageCheck },
    { to: '/user/profile', label: 'Profile', icon: User },
  ];

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users & Staff', icon: Users },
    { to: '/admin/devices', label: 'All Devices', icon: Smartphone },
    { to: '/admin/pickups', label: 'Pickups', icon: Truck },
    { to: '/admin/repairs', label: 'Repairs', icon: Wrench },
    { to: '/admin/recycling', label: 'Recycling', icon: Recycle },
    { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/user/profile', label: 'Profile', icon: User },
  ];

  let links = userLinks;
  if (role === 'collector') links = collectorLinks;
  if (role === 'technician') links = technicianLinks;
  if (role === 'admin') links = adminLinks;

  return (
    <aside className="w-64 bg-[#0d382c] text-white flex flex-col min-h-screen shrink-0 border-r border-[#16483a]">
      {/* Brand Header */}
      <div className="h-20 flex items-center px-6 border-b border-[#16483a]/60">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Leaf className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center">
              Re<span className="text-emerald-400">Tech</span>
            </h1>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-emerald-300/80 block">
              {role === 'user' ? 'E-Waste Portal' : `${role} Panel`}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/user/dashboard' || link.to.endsWith('/dashboard')}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout footer */}
      <div className="p-4 border-t border-[#16483a]/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-red-300 hover:text-red-100 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-400" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
