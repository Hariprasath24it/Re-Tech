import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deviceService } from '../../services/deviceService';
import { rewardService } from '../../services/rewardService';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import ErrorNotice from '../../components/ErrorNotice';
import {
  Package,
  Wrench,
  Repeat,
  Recycle,
  Award,
  ArrowRight,
  Plus,
  Truck,
  Sparkles,
  Laptop,
  Smartphone,
  Printer,
  Monitor,
} from 'lucide-react';

const UserDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [rewards, setRewards] = useState({ currentPoints: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deviceCounts, setDeviceCounts] = useState({ total: 0, underRepair: 0, reused: 0, recycled: 0 });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [devRes, repairRes, reusedRes, recycledRes, rewRes] = await Promise.all([
          deviceService.getMyDevices({ page: 1, limit: 5, sort: '-createdAt' }),
          deviceService.getMyDevices({ status: 'UNDER_REPAIR', page: 1, limit: 1 }),
          deviceService.getMyDevices({ status: 'REUSED', page: 1, limit: 1 }),
          deviceService.getMyDevices({ status: 'RECYCLED', page: 1, limit: 1 }),
          rewardService.getMyRewards().catch(() => ({ currentPoints: user?.rewardPoints || 0 })),
        ]);
        if (devRes.success) {
          setDevices(devRes.devices || []);
          setDeviceCounts({
            total: devRes.pagination?.total || 0,
            underRepair: repairRes.pagination?.total || 0,
            reused: reusedRes.pagination?.total || 0,
            recycled: recycledRes.pagination?.total || 0,
          });
        }
        if (rewRes.success) setRewards(rewRes);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Dashboard data could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // Compute stat counts
  const getDeviceIcon = (category) => {
    switch (category) {
      case 'Laptop':
        return <Laptop className="w-5 h-5 text-emerald-700" />;
      case 'Mobile Phone':
        return <Smartphone className="w-5 h-5 text-blue-700" />;
      case 'Printer':
        return <Printer className="w-5 h-5 text-slate-700" />;
      case 'Monitor':
        return <Monitor className="w-5 h-5 text-indigo-700" />;
      default:
        return <Package className="w-5 h-5 text-teal-700" />;
    }
  };

  return (
    <DashboardLayout
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Priya'} 👋`}
      subtitle="Let's make a cleaner and greener world together."
    >
      <ErrorNotice message={error} />
      {/* 4 Metric Cards Row matching the UI image */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Devices */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{deviceCounts.total}</h3>
            <p className="text-xs font-medium text-slate-500">Total Devices</p>
          </div>
        </div>

        {/* Under Repair */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{deviceCounts.underRepair}</h3>
            <p className="text-xs font-medium text-slate-500">Under Repair</p>
          </div>
        </div>

        {/* Reused */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{deviceCounts.reused}</h3>
            <p className="text-xs font-medium text-slate-500">Reused</p>
          </div>
        </div>

        {/* Recycled */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{deviceCounts.recycled}</h3>
            <p className="text-xs font-medium text-slate-500">Recycled</p>
          </div>
        </div>
      </div>

      {/* Main Grid: My Devices (Left 8 cols) & Rewards + Activity (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: My Devices Table */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-800">My Devices</h3>
              <p className="text-xs text-slate-400">Track and manage your submitted electronic equipment</p>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                to="/user/add-device"
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Device</span>
              </Link>
              <Link
                to="/user/devices"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading your devices...</div>
            ) : devices.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-700">No devices submitted yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                  Have an old laptop, phone, or printer lying around? Submit it to give it a second life!
                </p>
                <Link
                  to="/user/add-device"
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit E-Waste Device</span>
                </Link>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device._id}
                  className="p-5 flex items-center justify-between hover:bg-slate-50/70 transition"
                >
                  {/* Device Info with Thumbnail/Icon */}
                  <div className="flex items-center space-x-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                      {device.image ? (
                        <img
                          src={device.image}
                          alt={device.model}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getDeviceIcon(device.category)
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 truncate">
                        {device.category}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {device.brand} {device.model}
                      </p>
                      <span className="text-[11px] font-mono text-emerald-800 font-medium">
                        {device.deviceId}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="hidden sm:block">
                    <StatusBadge status={device.status} />
                  </div>

                  {/* Submission Date */}
                  <div className="hidden md:block text-right">
                    <span className="text-[11px] text-slate-400 block">Requested on</span>
                    <span className="text-xs font-medium text-slate-700">
                      {new Date(device.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Track CTA */}
                  <div>
                    <button
                      onClick={() => navigate(`/track/${device.deviceId}`)}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:border-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Rewards Card + Recent Activity Feed */}
        <div className="lg:col-span-4 space-y-6">
          {/* Rewards Card matching mockup */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">My Rewards</h3>
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-center space-x-3 mb-6">
              <div className="text-4xl font-black text-slate-800">
                {rewards.currentPoints || user?.rewardPoints || 0}
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Points
              </span>
            </div>

            <Link
              to="/user/rewards"
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition"
            >
              <span>Redeem Points</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Recent activity from the bounded recent-device response */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Recent Activity</h3>

            {devices.length === 0 ? (
              <p className="text-xs text-slate-400">No recent device activity.</p>
            ) : (
              <div className="space-y-4">
                {devices.slice(0, 3).map((device) => (
                  <div key={device._id} className="flex items-start space-x-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1.5 ring-4 ring-emerald-100 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{device.status.replaceAll('_', ' ')}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {new Date(device.createdAt).toLocaleDateString()} · {device.brand} {device.model}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
