import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { technicianService } from '../../services/technicianService';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { Recycle, RefreshCw, Archive, ExternalLink } from 'lucide-react';

const CompletedPage = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [reusedCount, setReusedCount] = useState(0);
  const [recycledCount, setRecycledCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompleted();
  }, [filterType, pagination.page]);

  const fetchCompleted = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedStatus = filterType === 'ALL' ? 'REUSED,RECYCLED' : filterType;
      const [res, reusedRes, recycledRes] = await Promise.all([
        technicianService.getCompletedDevices({ status: selectedStatus, page: pagination.page, limit: pagination.limit, sort: '-createdAt' }),
        technicianService.getCompletedDevices({ status: 'REUSED', page: 1, limit: 1 }),
        technicianService.getCompletedDevices({ status: 'RECYCLED', page: 1, limit: 1 }),
      ]);
      if (res.success) {
        setDevices(res.devices || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
        setReusedCount(reusedRes.pagination?.total || 0);
        setRecycledCount(recycledRes.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Completed devices could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const outcomeStyle = (outcome) => {
    switch (outcome) {
      case 'REUSED':
        return { bg: 'bg-emerald-100 text-emerald-800', icon: <RefreshCw className="w-3.5 h-3.5" /> };
      case 'RECYCLED':
        return { bg: 'bg-blue-100 text-blue-800', icon: <Recycle className="w-3.5 h-3.5" /> };
      default:
        return { bg: 'bg-slate-100 text-slate-600', icon: <Archive className="w-3.5 h-3.5" /> };
    }
  };

  const tabs = ['ALL', 'REUSED', 'RECYCLED'];

  return (
    <DashboardLayout
      title="Completed Devices"
      subtitle="All devices that have been successfully repaired and reused or recycled."
    >
      <ErrorNotice message={error} />
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Completed', value: reusedCount + recycledCount, color: 'text-slate-800', bg: 'bg-slate-50' },
          {
            label: 'Reused',
            value: reusedCount,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Recycled',
            value: recycledCount,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
        ].map((c) => (
          <div key={c.label} className={`rounded-2xl p-5 ${c.bg} border border-white/60 shadow-sm`}>
            <p className="text-xs font-semibold text-slate-500 mb-1">{c.label}</p>
            <p className={`text-3xl font-black ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => { setFilterType(t); setPagination((current) => ({ ...current, page: 1 })); }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
              filterType === t
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Device Outcomes</h3>
          <p className="text-xs text-slate-400">{pagination.total} records</p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading...</div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No completed devices found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Device ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Final Outcome</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Completed</th>
                  <th className="py-4 px-6 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => {
                  const style = outcomeStyle(device.status);
                  return (
                    <tr key={device._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-4 px-6 font-mono font-bold text-emerald-700">
                        {device.deviceId}
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800">
                          {device.brand} {device.model}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {device.owner?.name}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{device.category}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${style.bg}`}>
                          {style.icon}
                          <span>{device.status}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">{device.condition || '—'}</td>
                      <td className="py-4 px-6 text-slate-500">
                        {device.updatedAt
                          ? new Date(device.updatedAt).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => navigate(`/track/${device.deviceId}`)}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Track</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
      </div>
    </DashboardLayout>
  );
};

export default CompletedPage;
