import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { Wrench, Package, CheckCircle } from 'lucide-react';

const REPAIR_STATUS_COLORS = {
  PENDING: 'bg-slate-100 text-slate-700',
  'IN PROGRESS': 'bg-amber-100 text-amber-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
  'QUALITY CHECK': 'bg-blue-100 text-blue-800',
  'READY FOR REUSE': 'bg-green-100 text-green-800',
};

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [inProgressCount, setInProgressCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const statuses = ['ALL', 'PENDING', 'IN PROGRESS', 'QUALITY CHECK', 'READY FOR REUSE', 'COMPLETED'];

  useEffect(() => {
    fetchRepairs();
  }, [statusFilter, search, fromDate, toDate, pagination.page]);

  const fetchRepairs = async () => {
    setLoading(true);
    setError('');
    try {
      const commonParams = { search: search || undefined, fromDate: fromDate || undefined, toDate: toDate || undefined };
      const [res, inProgressRes, completedRes] = await Promise.all([
        adminService.getAllRepairs({
          ...commonParams,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page: pagination.page,
          limit: pagination.limit,
        }),
        adminService.getAllRepairs({ ...commonParams, status: 'IN PROGRESS', page: 1, limit: 1 }),
        adminService.getAllRepairs({ ...commonParams, status: 'COMPLETED', page: 1, limit: 1 }),
      ]);
      if (res.success) {
        setRepairs(res.repairs || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
        setInProgressCount(inProgressRes.pagination?.total || 0);
        setCompletedCount(completedRes.pagination?.total || 0);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Repair records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = repairs.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  return (
    <DashboardLayout
      title="Repair Records"
      subtitle="All device repair jobs logged by technicians."
    >
      <ErrorNotice message={error} />
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
            { label: 'Total Repairs', value: pagination.total, color: 'text-slate-700', bg: 'bg-slate-50' },
          {
            label: 'In Progress',
            value: inProgressCount,
            color: 'text-amber-700',
            bg: 'bg-amber-50',
          },
          {
            label: 'Completed',
            value: completedCount,
            color: 'text-emerald-700',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Current Page Cost',
            value: `₹${totalCost.toLocaleString()}`,
            color: 'text-blue-700',
            bg: 'bg-blue-50',
          },
        ].map((c) => (
          <div key={c.label} className={`${c.bg} rounded-2xl p-5 border border-white shadow-sm`}>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-black ${c.color} mt-1`}>{c.value}</p>
          </div>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search repair or device..."
        filters={[{ name: 'status', label: 'Status', value: statusFilter, onChange: (value) => { setStatusFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: statuses.map((value) => ({ value, label: value === 'ALL' ? 'All statuses' : value })) }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatusFilter('ALL'); setFromDate(''); setToDate(''); setPagination((current) => ({ ...current, page: 1 })); }}
      />

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading repairs...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Repair ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Problem</th>
                  <th className="py-4 px-6">Technician</th>
                  <th className="py-4 px-6">Parts Cost</th>
                  <th className="py-4 px-6">Labour</th>
                  <th className="py-4 px-6">Total</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairs.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {r.repairId}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {r.device?.brand} {r.device?.model}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-700">{r.device?.deviceId}</p>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-semibold text-slate-700 truncate">{r.problem}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {r.technician?.name || '—'}
                    </td>
                    <td className="py-4 px-6 text-slate-700">₹{r.partsCost || 0}</td>
                    <td className="py-4 px-6 text-slate-700">₹{r.labourCost || 0}</td>
                    <td className="py-4 px-6 font-bold text-emerald-800">₹{r.totalCost || 0}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${REPAIR_STATUS_COLORS[r.status] || 'bg-slate-100 text-slate-700'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {r.startedAt ? new Date(r.startedAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
                {repairs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                      No repair records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
      </div>
    </DashboardLayout>
  );
};

export default RepairsPage;
