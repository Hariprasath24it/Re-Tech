import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const getDashboardPath = () => {
    if (!user) return '/user/dashboard';
    switch (user.role) {
      case 'admin':
        return '/admin/dashboard';
      case 'collector':
        return '/collector/dashboard';
      case 'technician':
        return '/technician/dashboard';
      default:
        return '/user/dashboard';
    }
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
            <Leaf className="w-6 h-6" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            Re<span className="text-emerald-600">Tech</span>
          </span>
        </Link>

        {/* Public Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
          <a href="#home" className="hover:text-emerald-700 transition">
            Home
          </a>
          <a href="#how-it-works" className="hover:text-emerald-700 transition">
            How It Works
          </a>
          <a href="#services" className="hover:text-emerald-700 transition">
            Services
          </a>
          <a href="#impact" className="hover:text-emerald-700 transition">
            Impact
          </a>
          <Link to="/track" className="hover:text-emerald-700 transition">
            Track Device
          </Link>
        </nav>

        {/* Auth CTA */}
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardPath()}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-full text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition"
              >
                <span>Register</span>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
