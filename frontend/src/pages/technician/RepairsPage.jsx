import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { technicianService } from '../../services/technicianService';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { Wrench, Package, CheckCircle, AlertCircle } from 'lucide-react';

const REPAIR_STATUSES = [
  'PENDING',
  'IN PROGRESS',
  'COMPLETED',
  'QUALITY CHECK',
  'READY FOR REUSE',
];

const RepairsPage = () => {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [allocatingReuseId, setAllocatingReuseId] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchRepairs();
  }, [search, statusFilter, fromDate, toDate, pagination.page]);

  const fetchRepairs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await technicianService.getAllRepairs({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.success) {
        setRepairs(res.repairs || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Repair records could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const openUpdate = (repair) => {
    setSelectedRepair(repair);
    setNewStatus(repair.status);
    setUpdateNotes(repair.notes || '');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const res = await technicianService.updateRepair(selectedRepair._id, {
        status: newStatus,
        notes: updateNotes,
      });
      if (res.success) {
        setFeedback(`Repair job updated to: ${newStatus}`);
        setSelectedRepair(null);
        fetchRepairs();
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleAllocateForReuse = async (repair) => {
    const finalDestination = window.prompt(
      'Enter the final reuse destination:',
      'Local Community Educational Center'
    );
    if (!finalDestination?.trim()) return;

    setAllocatingReuseId(repair.device._id);
    try {
      const res = await technicianService.createReuse({
        deviceId: repair.device._id,
        reuseType: 'Donate',
        finalDestination: finalDestination.trim(),
        conditionAfterRepair: 'Refurbished - Grade A Functional',
        estimatedValue: 0,
        notes: repair.notes || '',
      });

      if (res.success) {
        setFeedback(`Device ${repair.device.deviceId} allocated for reuse.`);
        await fetchRepairs();
        setTimeout(() => setFeedback(''), 3000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Reuse allocation failed. Please try again.');
    } finally {
      setAllocatingReuseId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'IN PROGRESS':
        return 'bg-amber-100 text-amber-800';
      case 'COMPLETED':
      case 'READY FOR REUSE':
        return 'bg-emerald-100 text-emerald-800';
      case 'QUALITY CHECK':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <DashboardLayout
      title="Workshop Repair Jobs"
      subtitle="Manage active and completed device repairs."
    >
      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search repair or device..."
        filters={[{ name: 'status', label: 'Status', value: statusFilter, onChange: (value) => { setStatusFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
          { value: 'ALL', label: 'All statuses' }, ...REPAIR_STATUSES.map((status) => ({ value: status, label: status })),
        ] }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setStatusFilter('ALL'); setFromDate(''); setToDate(''); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />
      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Active Repair Jobs</h3>
            <p className="text-xs text-slate-400">Click "Update" to progress a job through stages.</p>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            {pagination.total} matching jobs
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading repair records...</div>
        ) : repairs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No repair jobs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Repair ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Problem / Diagnosis</th>
                  <th className="py-4 px-6">Cost Breakdown</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Started</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {repairs.map((repair) => (
                  <tr key={repair._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {repair.repairId}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {repair.device?.image ? (
                            <img src={repair.device.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-amber-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {repair.device?.brand} {repair.device?.model}
                          </p>
                          <p className="font-mono text-[10px] text-emerald-700">
                            {repair.device?.deviceId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-semibold text-slate-800 truncate">{repair.problem}</p>
                      <p className="text-[11px] text-slate-400 truncate">{repair.diagnosis}</p>
                    </td>

                    <td className="py-4 px-6">
                      <div className="space-y-0.5">
                        <p className="text-slate-500">
                          Parts: <span className="font-semibold text-slate-700">₹{repair.partsCost}</span>
                        </p>
                        <p className="text-slate-500">
                          Labour: <span className="font-semibold text-slate-700">₹{repair.labourCost}</span>
                        </p>
                        <p className="font-bold text-emerald-800">
                          Total: ₹{repair.totalCost}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(repair.status)}`}>
                        {repair.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {repair.startedAt
                        ? new Date(repair.startedAt).toLocaleDateString()
                        : '—'}
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <button
                        onClick={() => openUpdate(repair)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition"
                      >
                        Update
                      </button>
                      {repair.device?.status === 'READY_FOR_REUSE' && (
                        <button
                          onClick={() => handleAllocateForReuse(repair)}
                          disabled={allocatingReuseId === repair.device._id}
                          className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition disabled:opacity-50"
                        >
                          {allocatingReuseId === repair.device._id ? 'Allocating...' : 'Allocate for Reuse'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/track/${repair.device?.deviceId}`)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 hover:bg-slate-100 transition"
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

      {/* Update Repair Status Modal */}
      {selectedRepair && (
        <Modal
          isOpen={!!selectedRepair}
          onClose={() => setSelectedRepair(null)}
          title={`Update Repair: ${selectedRepair.repairId}`}
        >
          <form onSubmit={handleUpdate} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800">
                {selectedRepair.device?.brand} {selectedRepair.device?.model}
              </p>
              <p className="text-slate-500">{selectedRepair.problem}</p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Update Repair Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-sm"
              >
                {REPAIR_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Progress Notes
              </label>
              <textarea
                rows={3}
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="e.g. IC replaced, running burn-in test..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedRepair(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default RepairsPage;
