import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Leaf, Recycle, TrendingUp } from 'lucide-react';

const PIE_PALETTE = [
  '#10b981', '#22c55e', '#14b8a6', '#6366f1',
  '#f59e0b', '#f97316', '#94a3b8', '#e11d48',
];

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white shadow-xl rounded-xl border border-slate-100 px-4 py-3 text-xs">
      {label && <p className="font-bold text-slate-600 mb-2">{label}</p>}
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

const DistributionChart = ({ title, subtitle, data, labelKey, color }) => (
  <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
    <h3 className="text-sm font-bold text-slate-800 mb-1">{title}</h3>
    <p className="text-xs text-slate-400 mb-6">{subtitle}</p>
    {data.length === 0 ? (
      <div className="h-52 flex items-center justify-center text-xs text-slate-400">No data yet</div>
    ) : (
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey={labelKey} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
);

const formatNumber = (value) => Number(value ?? 0).toLocaleString();

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await adminService.getAnalytics();
        if (res.success) setAnalytics(res.analytics || {});
        else setError(res.message || 'Analytics could not be loaded.');
      } catch (err) {
        setError(err.response?.data?.message || 'Analytics could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const devices = analytics?.devices || {};
  const pickups = analytics?.pickups || {};
  const inspections = analytics?.inspections || {};
  const repairs = analytics?.repairs || {};
  const recycling = analytics?.recycling || {};
  const rewards = analytics?.rewards || {};
  const environmentalImpact = analytics?.environmentalImpact || {};

  const statusData = devices.statusDistribution || [];
  const categoryData = devices.categoryDistribution || [];
  const monthlyRegistrations = devices.monthlyRegistrations || [];
  const pickupStatusData = pickups.statusDistribution || [];
  const inspectionData = inspections.outcomeDistribution || [];
  const repairStatusData = repairs.statusDistribution || [];
  const recyclingStatusData = recycling.statusDistribution || [];
  const rewardTypeData = rewards.transactionTypeDistribution || [];
  const terminalStatusCounts = devices.terminalStatusCounts || {};

  const divertedDevices = environmentalImpact.divertedDevices
    ?? environmentalImpact.landfillDivertedDevices
    ?? 0;
  const reusedDevices = environmentalImpact.reusedDevices ?? terminalStatusCounts.REUSED ?? 0;
  const recycledDevices = environmentalImpact.recycledDevices ?? terminalStatusCounts.RECYCLED ?? 0;
  const recycledWeightKg = environmentalImpact.recycledWeightKg
    ?? environmentalImpact.recoveredMaterialsKg
    ?? recycling.totalWeightKg
    ?? 0;
  const co2OffsetKg = environmentalImpact.co2OffsetKg ?? recycling.totalCo2OffsetKg ?? 0;
  const recyclingRecordCount = recycling.recordCount ?? recycling.totalRecords ?? 0;
  const earnedPoints = rewards.earnedPoints ?? rewards.totalRewardPoints ?? 0;
  const redeemedPoints = rewards.redeemedPoints ?? rewards.totalRewardPointsRedeemed ?? 0;
  const rewardTransactionCount = rewards.transactionCount ?? rewards.totalRewardTransactions ?? 0;

  const impactCards = [
    {
      label: 'Devices Diverted',
      value: formatNumber(divertedDevices),
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-emerald-700',
      bg: 'from-emerald-50 to-emerald-100',
    },
    {
      label: 'CO₂ Offset (kg)',
      value: formatNumber(co2OffsetKg),
      icon: <Leaf className="w-5 h-5" />,
      color: 'text-teal-700',
      bg: 'from-teal-50 to-teal-100',
    },
    {
      label: 'Reused Devices',
      value: formatNumber(reusedDevices),
      icon: <Recycle className="w-5 h-5" />,
      color: 'text-blue-700',
      bg: 'from-blue-50 to-blue-100',
    },
    {
      label: 'Recycled Devices',
      value: formatNumber(recycledDevices),
      icon: <Recycle className="w-5 h-5" />,
      color: 'text-amber-700',
      bg: 'from-amber-50 to-amber-100',
    },
  ];

  return (
    <DashboardLayout
      title="Platform Analytics"
      subtitle="Visual insights into ReTech's e-waste impact and operational performance."
    >
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">Loading analytics...</div>
      ) : (
        <>
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* ── Environmental Impact ─── */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
              🌍 Environmental Impact
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {impactCards.map((c) => (
                <div
                  key={c.label}
                  className={`bg-gradient-to-br ${c.bg} rounded-2xl p-5 border border-white shadow-sm`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center ${c.color} mb-3`}>
                    {c.icon}
                  </div>
                  <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                  <p className="text-[11px] font-bold text-slate-600 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Row 1: Pie + Bar ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution Pie */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Device Status Distribution</h3>
              <p className="text-xs text-slate-400 mb-6">Where all devices currently stand in the lifecycle.</p>
              {statusData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="status"
                      label={({ status, percent }) =>
                        percent > 0.05 ? `${status} ${(percent * 100).toFixed(0)}%` : ''
                      }
                      labelLine={false}
                    >
                      {statusData.map((item, i) => (
                        <Cell key={item.status} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Legend */}
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {statusData.map((item, i) => (
                  <div key={item.status} className="flex items-center space-x-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }}
                    />
                    <span className="text-[11px] text-slate-500 font-medium">
                      {item.status}: {formatNumber(item.count)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Bar Chart */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-1">Devices by Category</h3>
              <p className="text-xs text-slate-400 mb-6">Number of devices grouped by database category.</p>
              {categoryData.length === 0 ? (
                <div className="h-52 flex items-center justify-center text-xs text-slate-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={categoryData} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="category" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Devices" radius={[6, 6, 0, 0]}>
                      {categoryData.map((item, i) => (
                        <Cell key={item.category} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ── Row 2: Monthly Trend Area Chart ─── */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Monthly Device Registrations</h3>
            <p className="text-xs text-slate-400 mb-6">Devices grouped by their actual registration month.</p>
            {monthlyRegistrations.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-xs text-slate-400">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={monthlyRegistrations}>
                  <defs>
                    <linearGradient id="registrationFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Registrations" stroke="#10b981" strokeWidth={2.5} fill="url(#registrationFill)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Workflow Statistics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DistributionChart
                title="Pickup Status"
                subtitle={`Records: ${formatNumber(pickups.total)} · Pending: ${formatNumber(pickups.pending)}`}
                data={pickupStatusData}
                labelKey="status"
                color="#f59e0b"
              />
              <DistributionChart
                title="Inspection Outcomes"
                subtitle={`Inspection records: ${formatNumber(inspections.total)}`}
                data={inspectionData}
                labelKey="outcome"
                color="#6366f1"
              />
              <DistributionChart
                title="Repair Status"
                subtitle={`Records: ${formatNumber(repairs.total)} · Completed: ${formatNumber(repairs.completed)}`}
                data={repairStatusData}
                labelKey="status"
                color="#f97316"
              />
              <DistributionChart
                title="Recycling Status"
                subtitle={`Records: ${formatNumber(recyclingRecordCount)} · Weight: ${formatNumber(recycledWeightKg)} kg · CO₂: ${formatNumber(co2OffsetKg)} kg`}
                data={recyclingStatusData}
                labelKey="status"
                color="#14b8a6"
              />
              <DistributionChart
                title="Reward Transactions"
                subtitle={`Earned: ${formatNumber(earnedPoints)} pts · Redeemed: ${formatNumber(redeemedPoints)} pts · Transactions: ${formatNumber(rewardTransactionCount)}`}
                data={rewardTypeData.map((item) => ({ type: item.type, count: item.transactions }))}
                labelKey="type"
                color="#10b981"
              />
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default Analytics;
