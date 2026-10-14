import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { pickupService } from '../../services/pickupService';
import StatusBadge from '../../components/StatusBadge';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { Truck, Phone, MapPin, CheckCircle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AssignedPickups = () => {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('preferredDate');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchAssigned();
  }, [status, fromDate, toDate, sort, pagination.page]);

  const fetchAssigned = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await pickupService.getCollectorAssigned({
        status: status === 'ALL' ? undefined : status,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
        sort,
      });
      if (res.success) {
        setPickups(res.pickups || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Assigned pickups could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCollected = async (id) => {
    setActionLoading(true);
    try {
      await pickupService.markCollected(id);
      fetchAssigned();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My Assigned Pickups"
      subtitle="Pickups assigned to you for collection from customers."
    >
      <FilterBar
        filters={[{ name: 'status', label: 'Status', value: status, onChange: (value) => { setStatus(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
          { value: 'ALL', label: 'All statuses' }, { value: 'ASSIGNED', label: 'Assigned' },
          { value: 'COLLECTED', label: 'Collected' }, { value: 'RECEIVED', label: 'Received' },
          { value: 'COMPLETED', label: 'Completed' },
        ] }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        sort={sort}
        sortOptions={[{ value: 'preferredDate', label: 'Soonest first' }, { value: '-preferredDate', label: 'Latest first' }, { value: '-createdAt', label: 'Newest added' }]}
        onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setStatus('ALL'); setFromDate(''); setToDate(''); setSort('preferredDate'); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Active Routes ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading assigned jobs...</div>
        ) : pickups.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No pending assigned pickups!</p>
            <p className="text-xs text-slate-400 mt-1">Accept new pickup requests from the dispatch queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pickups.map((pickup) => (
              <div
                key={pickup._id}
                className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      {pickup.device?.category} - {pickup.device?.brand} {pickup.device?.model}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono">{pickup.device?.deviceId}</p>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-slate-600">
                      <span className="font-semibold">{pickup.user?.name}</span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{pickup.contactNumber}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-xs space-y-1">
                  <p className="text-slate-700 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{pickup.address?.street}, {pickup.address?.city}</span>
                  </p>
                  <p className="text-slate-400">
                    Slot: {new Date(pickup.preferredDate).toLocaleDateString()} ({pickup.preferredTime})
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMarkCollected(pickup._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition"
                  >
                    Mark Collected
                  </button>
                  <button
                    onClick={() => navigate(`/track/${pickup.device?.deviceId}`)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition"
                  >
                    Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
      </div>
    </DashboardLayout>
  );
};

export default AssignedPickups;
