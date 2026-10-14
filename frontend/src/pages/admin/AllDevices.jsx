import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { adminService } from '../../services/adminService';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { ExternalLink, Package } from 'lucide-react';

const STATUSES = [
  'ALL', 'REGISTERED', 'PICKUP_REQUESTED', 'ASSIGNED', 'COLLECTED', 'RECEIVED',
  'UNDER_INSPECTION', 'UNDER_REPAIR', 'REPAIRED', 'QUALITY_CHECK', 'READY_FOR_REUSE', 'REUSED',
  'READY_FOR_RECYCLING', 'RECYCLED',
];

const STATUS_COLORS = {
  REGISTERED: 'bg-slate-100 text-slate-700',
  PICKUP_REQUESTED: 'bg-amber-100 text-amber-700',
  COLLECTED: 'bg-blue-100 text-blue-700',
  RECEIVED: 'bg-purple-100 text-purple-700',
  UNDER_REPAIR: 'bg-orange-100 text-orange-700',
  REPAIRED: 'bg-emerald-100 text-emerald-700',
  QUALITY_CHECK: 'bg-blue-100 text-blue-700',
  READY_FOR_REUSE: 'bg-green-100 text-green-800',
  REUSED: 'bg-green-100 text-green-800',
  READY_FOR_RECYCLING: 'bg-cyan-100 text-cyan-800',
  RECYCLED: 'bg-teal-100 text-teal-800',
};

const AllDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
  }, [search, statusFilter, category, fromDate, toDate, sort, pagination.page]);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getAllDevices({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: category === 'ALL' ? undefined : category,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort,
      });
      if (res.success) {
        setDevices(res.devices || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Devices could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="All Devices"
      subtitle="Complete inventory of all registered e-waste devices."
    >
      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search device ID, brand, model..."
        filters={[
          { name: 'status', label: 'Status', value: statusFilter, onChange: (value) => { setStatusFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: STATUSES.map((value) => ({ value, label: value === 'ALL' ? 'All statuses' : value })) },
          { name: 'category', label: 'Category', value: category, onChange: (value) => { setCategory(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
            { value: 'ALL', label: 'All categories' }, ...['Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television', 'Printer', 'Tablet', 'Keyboard', 'Mouse', 'Charger', 'Headphones', 'Other'].map((value) => ({ value, label: value })),
          ] },
        ]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        sort={sort}
        sortOptions={[{ value: '-createdAt', label: 'Newest first' }, { value: 'createdAt', label: 'Oldest first' }, { value: 'deviceId', label: 'Device ID' }, { value: 'purchaseYear', label: 'Purchase year' }]}
        onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatusFilter('ALL'); setCategory('ALL'); setFromDate(''); setToDate(''); setSort('-createdAt'); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />

      {/* Stats row */}
      <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500">
        <span>Total: <strong className="text-slate-800">{pagination.total}</strong></span>
        {statusFilter !== 'ALL' && (
          <span>Filtered: <strong className="text-emerald-700">{pagination.total}</strong></span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading devices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Device ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Submitted By</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Submitted</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {devices.map((device) => (
                  <tr key={device._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-emerald-700">{device.deviceId}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          {device.image ? (
                            <img src={device.image} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Package className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{device.brand} {device.model}</p>
                          <p className="text-[11px] text-slate-400">{device.purchaseYear || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{device.category}</td>
                    <td className="py-4 px-6">
                      <p className="font-semibold text-slate-700">{device.owner?.name}</p>
                      <p className="text-[11px] text-slate-400">{device.owner?.email}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{device.condition}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[device.status] || 'bg-slate-100 text-slate-700'}`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(device.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/track/${device.deviceId}`)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Track</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {devices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No devices found.
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

export default AllDevices;
