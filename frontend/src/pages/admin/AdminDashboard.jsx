import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import {
  Smartphone, Recycle, RefreshCw, Package,
  Users, Truck, Wrench, TrendingUp, Bell, ChevronRight
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentDevices, setRecentDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [statsRes, devicesRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllDevices({ limit: 5, sort: '-createdAt' }),
      ]);
      if (statsRes.success) setStats(statsRes.stats);
      if (devicesRes.success) setRecentDevices(devicesRes.devices?.slice(0, 5) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats
    ? [
        {
          label: 'Total Devices',
          value: stats.totalDevices || 0,
          icon: <Smartphone className="w-5 h-5" />,
          color: 'text-slate-700',
          bg: 'bg-slate-100',
          path: '/admin/devices',
        },
        {
          label: 'Total Users',
          value: stats.totalUsers || 0,
          icon: <Users className="w-5 h-5" />,
          color: 'text-violet-700',
          bg: 'bg-violet-100',
          path: '/admin/users',
        },
        {
          label: 'Pickups',
          value: stats.totalPickups || 0,
          icon: <Truck className="w-5 h-5" />,
          color: 'text-amber-700',
          bg: 'bg-amber-100',
          path: '/admin/pickups',
        },
        {
          label: 'Inspected',
          value: stats.totalInspections || 0,
          icon: <Package className="w-5 h-5" />,
          color: 'text-blue-700',
          bg: 'bg-blue-100',
          path: '/admin/devices',
        },
        {
          label: 'Repaired',
          value: stats.totalRepaired || 0,
          icon: <Wrench className="w-5 h-5" />,
          color: 'text-orange-700',
          bg: 'bg-orange-100',
          path: '/admin/repairs',
        },
        {
          label: 'Reused',
          value: stats.totalReused || 0,
          icon: <RefreshCw className="w-5 h-5" />,
          color: 'text-emerald-700',
          bg: 'bg-emerald-100',
          path: '/admin/devices',
        },
        {
          label: 'Recycled',
          value: stats.totalRecycled || 0,
          icon: <Recycle className="w-5 h-5" />,
          color: 'text-teal-700',
          bg: 'bg-teal-100',
          path: '/admin/recycling',
        },
        {
          label: 'Analytics',
          value: '→ View',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-rose-700',
          bg: 'bg-rose-100',
          path: '/admin/analytics',
        },
      ]
    : [];

  const statusColor = (status) => {
    const map = {
      SUBMITTED: 'bg-slate-100 text-slate-700',
      COLLECTED: 'bg-amber-100 text-amber-800',
      INSPECTED: 'bg-blue-100 text-blue-800',
      REPAIRED: 'bg-orange-100 text-orange-800',
      REUSED: 'bg-emerald-100 text-emerald-800',
      RECYCLED: 'bg-teal-100 text-teal-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <DashboardLayout
      title="Admin Control Centre"
      subtitle="Full oversight of the ReTech e-waste ecosystem."
    >
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading admin data...</div>
      ) : (
        <>
          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statCards.map((c) => (
              <button
                key={c.label}
                onClick={() => navigate(c.path)}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm text-left hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center ${c.color} mb-3`}>
                  {c.icon}
                </div>
                <p className="text-xs font-semibold text-slate-400">{c.label}</p>
                <p className={`text-2xl font-black ${c.color} mt-0.5`}>{c.value}</p>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-3xl p-6 text-white">
              <h3 className="font-bold text-lg mb-1">Add Staff Member</h3>
              <p className="text-xs text-emerald-200 mb-4">
                Register new collector or technician accounts.
              </p>
              <button
                onClick={() => navigate('/admin/users')}
                className="bg-white text-emerald-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-50 transition"
              >
                Manage Users →
              </button>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white">
              <h3 className="font-bold text-lg mb-1">View Analytics</h3>
              <p className="text-xs text-blue-200 mb-4">
                Charts, trends, and environmental impact metrics.
              </p>
              <button
                onClick={() => navigate('/admin/analytics')}
                className="bg-white text-blue-800 font-bold text-xs px-4 py-2 rounded-xl hover:bg-blue-50 transition"
              >
                Open Analytics →
              </button>
            </div>
          </div>

          {/* Recent Devices */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Latest Submissions</h3>
              <button
                onClick={() => navigate('/admin/devices')}
                className="text-xs text-emerald-700 font-bold flex items-center space-x-1 hover:underline"
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {recentDevices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No devices yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentDevices.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition cursor-pointer"
                    onClick={() => navigate(`/track/${d.deviceId}`)}
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">
                        {d.brand} {d.model}
                      </p>
                      <p className="text-xs text-slate-400">
                        {d.deviceId} · {d.submittedBy?.name}
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
