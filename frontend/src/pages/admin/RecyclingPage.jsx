import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { Recycle, Leaf } from 'lucide-react';

const RecyclingPage = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [metrics, setMetrics] = useState({ totalWeightKg: 0, totalCo2OffsetKg: 0 });

  useEffect(() => {
    fetchRecycling();
  }, [search, status, fromDate, toDate, sort, pagination.page]);

  const fetchRecycling = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAllRecycling({
        search: search || undefined,
        status: status === 'ALL' ? undefined : status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort,
      });
      if (res.success) {
        setRecords(res.records || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
        setMetrics(res.metrics || { totalWeightKg: 0, totalCo2OffsetKg: 0 });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Recycling records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Recycling Records"
      subtitle="All devices certified for responsible recycling."
    >
      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search recycling ID, partner, device..."
        filters={[{ name: 'status', label: 'Status', value: status, onChange: (value) => { setStatus(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
          { value: 'ALL', label: 'All statuses' }, { value: 'SCHEDULED', label: 'Scheduled' },
          { value: 'IN_PROCESS', label: 'In process' }, { value: 'COMPLETED', label: 'Completed' },
        ] }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        sort={sort}
        sortOptions={[{ value: '-createdAt', label: 'Newest first' }, { value: 'createdAt', label: 'Oldest first' }, { value: '-weightKg', label: 'Heaviest first' }, { value: 'weightKg', label: 'Lightest first' }]}
        onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatus('ALL'); setFromDate(''); setToDate(''); setSort('-createdAt'); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />
      {/* Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Devices Recycled',
            value: pagination.total,
            icon: <Recycle className="w-5 h-5" />,
            color: 'text-teal-700',
            bg: 'bg-teal-50',
          },
          {
            label: 'CO₂ Saved (kg)',
            value: Number(metrics.totalCo2OffsetKg || 0).toFixed(1),
            icon: <Leaf className="w-5 h-5" />,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
          },
          {
            label: 'E-Waste Weight (kg)',
            value: Number(metrics.totalWeightKg || 0).toFixed(1),
            icon: <Recycle className="w-5 h-5" />,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm flex items-center space-x-4`}>
            <div className={`w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center ${c.color}`}>
              {c.icon}
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{c.label}</p>
              <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">Recycling Log</h3>
          <p className="text-xs text-slate-400">{pagination.total} total records</p>
        </div>
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading recycling records...</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No recycling records yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Recycling ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Recycling Centre</th>
                  <th className="py-4 px-6">Method</th>
                  <th className="py-4 px-6">Weight (kg)</th>
                  <th className="py-4 px-6">CO₂ Saved</th>
                  <th className="py-4 px-6">Handled By</th>
                  <th className="py-4 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-teal-700">
                      {r.recyclingId}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {r.device?.brand} {r.device?.model}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-700">{r.device?.deviceId}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{r.partner || '—'}</td>
                    <td className="py-4 px-6 text-slate-600">{r.method || '—'}</td>
                    <td className="py-4 px-6 font-semibold text-slate-700">
                      {r.weightKg || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-emerald-700 font-bold">
                        {r.co2OffsetKg ? `${r.co2OffsetKg} kg` : '—'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{r.handledBy?.name || '—'}</td>
                    <td className="py-4 px-6 text-slate-500">
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
      </div>
    </DashboardLayout>
  );
};

export default RecyclingPage;
