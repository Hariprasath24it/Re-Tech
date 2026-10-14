import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { pickupService } from '../../services/pickupService';
import StatusBadge from '../../components/StatusBadge';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { useNavigate } from 'react-router-dom';

const CompletedPickups = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPickups();
  }, [search, status, fromDate, toDate, pagination.page]);

  const fetchPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await pickupService.getAllPickups({
        search: search || undefined,
        status: status === 'ALL' ? 'COLLECTED,RECEIVED,COMPLETED' : status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort: '-collectedAt',
      });
      if (res.success) {
        setPickups(res.pickups || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Pickup history could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Completed Pickups History"
      subtitle="Historical log of all successfully collected e-waste devices."
    >
      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search device, customer, or pickup..."
        filters={[{ name: 'status', label: 'Status', value: status, onChange: (value) => { setStatus(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
          { value: 'ALL', label: 'All completed statuses' }, { value: 'COLLECTED', label: 'Collected' },
          { value: 'RECEIVED', label: 'Received' }, { value: 'COMPLETED', label: 'Completed' },
        ] }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatus('ALL'); setFromDate(''); setToDate(''); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Retrieved Equipment Log ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading history...</div>
        ) : pickups.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No completed pickups yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Customer</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Collected On</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pickups.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {p.device?.category} - {p.device?.brand} {p.device?.model}
                      </p>
                      <p className="font-mono text-[10px] text-emerald-700">{p.device?.deviceId}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{p.user?.name}</td>
                    <td className="py-4 px-6 text-slate-500">{p.address?.city}</td>
                    <td className="py-4 px-6 text-slate-500">
                      {p.collectedAt ? new Date(p.collectedAt).toLocaleDateString() : 'Collected'}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/track/${p.device?.deviceId}`)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
                      >
                        Track
                      </button>
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

export default CompletedPickups;
