import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { MapPin, Clock } from 'lucide-react';

const PICKUP_STATUSES = ['ALL', 'REQUESTED', 'ASSIGNED', 'COLLECTED', 'RECEIVED', 'COMPLETED'];

const STATUS_STYLES = {
  REQUESTED: 'bg-amber-100 text-amber-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  COLLECTED: 'bg-emerald-100 text-emerald-800',
  RECEIVED: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
};

const formatPickupAddress = (address) => {
  if (typeof address === 'string') return address;
  return [address?.street, address?.city, address?.state, address?.pincode]
    .filter(Boolean)
    .join(', ');
};

const PickupManagement = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('preferredDate');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statCounts, setStatCounts] = useState({});

  useEffect(() => {
    fetchPickups();
  }, [statusFilter, search, fromDate, toDate, sort, pagination.page]);

  const fetchPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const commonParams = {
        search: search || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        sort,
      };
      const [res, ...countResponses] = await Promise.all([
        adminService.getAllPickups({
          ...commonParams,
          status: statusFilter === 'ALL' ? undefined : statusFilter,
          page: pagination.page,
          limit: pagination.limit,
        }),
        ...PICKUP_STATUSES.slice(1).map((status) => adminService.getAllPickups({ ...commonParams, status, page: 1, limit: 1 })),
      ]);
      if (res.success) {
        setPickups(res.pickups || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
        setStatCounts(Object.fromEntries(PICKUP_STATUSES.slice(1).map((status, index) => [
          status,
          countResponses[index]?.pagination?.total || 0,
        ])));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Pickups could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="Pickup Management"
      subtitle="Monitor all pickup requests across the city."
    >
      <ErrorNotice message={error} />
      {/* Summary counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(statCounts).map(([status, count]) => (
          <div
            key={status}
            className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{status}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{count}</p>
          </div>
        ))}
      </div>

      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search by device, user, address..."
        filters={[{ name: 'status', label: 'Status', value: statusFilter, onChange: (value) => { setStatusFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: PICKUP_STATUSES.map((value) => ({ value, label: value === 'ALL' ? 'All statuses' : value })) }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        sort={sort}
        sortOptions={[{ value: 'preferredDate', label: 'Soonest first' }, { value: '-preferredDate', label: 'Latest scheduled' }, { value: '-createdAt', label: 'Newest added' }]}
        onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatusFilter('ALL'); setFromDate(''); setToDate(''); setSort('preferredDate'); setPagination((current) => ({ ...current, page: 1 })); }}
      />

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading pickups...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Pickup ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Collector</th>
                  <th className="py-4 px-6">Address</th>
                  <th className="py-4 px-6">Scheduled</th>
                  <th className="py-4 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pickups.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {p.pickupId || p._id?.slice(-6).toUpperCase()}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {p.device?.brand} {p.device?.model}
                      </p>
                      <p className="text-[11px] font-mono text-emerald-700">{p.device?.deviceId}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-700">{p.user?.name}</p>
                      <p className="text-[11px] text-slate-400">{p.user?.phone}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {p.collector?.name || (
                        <span className="text-slate-300 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <div className="flex items-start space-x-1 text-slate-500">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        <span className="truncate">{formatPickupAddress(p.address) || '—'}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-1 text-slate-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>
                          {p.preferredDate
                            ? new Date(p.preferredDate).toLocaleDateString()
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[p.status] || 'bg-slate-100 text-slate-700'}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {pickups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                      No pickups found.
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

export default PickupManagement;
