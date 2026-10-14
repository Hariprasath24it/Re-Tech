import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { pickupService } from '../../services/pickupService';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import {
  Truck,
  ClipboardList,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Package,
  Calendar,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const CollectorDashboard = () => {
  const [pickups, setPickups] = useState([]);
  const [activeTab, setActiveTab] = useState('REQUESTED'); // 'REQUESTED' | 'ASSIGNED' | 'COLLECTED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPickup, setSelectedPickup] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [statusCounts, setStatusCounts] = useState({ REQUESTED: 0, ASSIGNED: 0, COLLECTED: 0, RECEIVED: 0, COMPLETED: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const navigate = useNavigate();

  useEffect(() => {
    fetchPickups();
  }, [activeTab, pagination.page]);

  const fetchPickups = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedStatus = activeTab === 'COLLECTED' ? 'COLLECTED,RECEIVED,COMPLETED' : activeTab;
      const statuses = ['REQUESTED', 'ASSIGNED', 'COLLECTED', 'RECEIVED', 'COMPLETED'];
      const [res, ...countResponses] = await Promise.all([
        pickupService.getAllPickups({ status: selectedStatus, page: pagination.page, limit: pagination.limit, sort: 'preferredDate' }),
        ...statuses.map((status) => pickupService.getAllPickups({ status, page: 1, limit: 1 })),
      ]);
      if (res.success) {
        setPickups(res.pickups || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
        setStatusCounts(Object.fromEntries(statuses.map((status, index) => [
          status,
          countResponses[index]?.pagination?.total || 0,
        ])));
      }
    } catch (err) {
      console.error('Error fetching collector pickups:', err);
      setError(err.response?.data?.message || 'Pickup requests could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (pickupId) => {
    setActionLoading(true);
    try {
      const res = await pickupService.acceptPickup(pickupId);
      if (res.success) {
        setMessage('Pickup request accepted and assigned to you!');
        setTimeout(() => setMessage(''), 3000);
        fetchPickups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept pickup.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCollected = async (pickupId) => {
    setActionLoading(true);
    try {
      const res = await pickupService.markCollected(pickupId);
      if (res.success) {
        setMessage('Item marked as COLLECTED from customer premises!');
        setTimeout(() => setMessage(''), 3000);
        fetchPickups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark as collected.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReceived = async (pickupId) => {
    setActionLoading(true);
    try {
      const res = await pickupService.markReceived(pickupId);
      if (res.success) {
        setMessage('Device safely checked into central facility hub!');
        setTimeout(() => setMessage(''), 3000);
        fetchPickups();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark received at hub.');
    } finally {
      setActionLoading(false);
    }
  };

  const requestedCount = statusCounts.REQUESTED;
  const assignedCount = statusCounts.ASSIGNED;
  const completedCount = statusCounts.COLLECTED + statusCounts.RECEIVED + statusCounts.COMPLETED;
  const currentList = pickups;

  return (
    <DashboardLayout
      title="Collection Dispatch Hub"
      subtitle="Manage assigned pickups and doorstep e-waste retrieval logistics."
    >
      <ErrorNotice message={error} />
      {/* Top Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div
          onClick={() => { setActiveTab('REQUESTED'); setPagination((current) => ({ ...current, page: 1 })); }}
          className={`cursor-pointer rounded-2xl p-5 border transition ${
            activeTab === 'REQUESTED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500'
              : 'bg-white border-slate-100 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">New Pickup Requests</span>
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              {requestedCount}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{requestedCount}</p>
        </div>

        <div
          onClick={() => { setActiveTab('ASSIGNED'); setPagination((current) => ({ ...current, page: 1 })); }}
          className={`cursor-pointer rounded-2xl p-5 border transition ${
            activeTab === 'ASSIGNED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500'
              : 'bg-white border-slate-100 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Assigned In Progress</span>
            <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center">
              {assignedCount}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{assignedCount}</p>
        </div>

        <div
          onClick={() => { setActiveTab('COLLECTED'); setPagination((current) => ({ ...current, page: 1 })); }}
          className={`cursor-pointer rounded-2xl p-5 border transition ${
            activeTab === 'COLLECTED'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500'
              : 'bg-white border-slate-100 hover:shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Completed Pickups</span>
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
              {completedCount}
            </span>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{completedCount}</p>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Main Table Card matching mockup */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Table Tabs matching mockup: New Requests (8), Assigned (3), Completed (12) */}
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Pickup Requests</h3>
            <p className="text-xs text-slate-400">View pickup requests from users.</p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('REQUESTED'); setPagination((current) => ({ ...current, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'REQUESTED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              New Requests ({requestedCount})
            </button>
            <button
              onClick={() => { setActiveTab('ASSIGNED'); setPagination((current) => ({ ...current, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'ASSIGNED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Assigned ({assignedCount})
            </button>
            <button
              onClick={() => { setActiveTab('COLLECTED'); setPagination((current) => ({ ...current, page: 1 })); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'COLLECTED'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Table matching mockup columns: #, Device, User, Location, Requested On, Action */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading pickups...</div>
          ) : currentList.length === 0 ? (
            <div className="p-12 text-center">
              <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700">No pickups in this category</p>
              <p className="text-xs text-slate-400 mt-1">Check the other tabs for pending or active jobs.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6 w-12">#</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Requested On</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {currentList.map((pickup, idx) => (
                  <tr key={pickup._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">{(pagination.page - 1) * pagination.limit + idx + 1}</td>

                    {/* Device info matching mockup */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {pickup.device?.image ? (
                            <img
                              src={pickup.device.image}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {pickup.device?.category}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {pickup.device?.brand} {pickup.device?.model}
                          </p>
                          <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                            {pickup.device?.deviceId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* User info matching mockup */}
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{pickup.user?.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{pickup.contactNumber || pickup.user?.phone}</span>
                      </p>
                    </td>

                    {/* Location matching mockup */}
                    <td className="py-4 px-6">
                      <p className="font-medium text-slate-700">
                        {pickup.address?.city || 'Chennai'}
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-xs truncate">
                        {pickup.address?.street}
                      </p>
                    </td>

                    {/* Requested On matching mockup */}
                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {new Date(pickup.preferredDate || pickup.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }
                      )}
                      <span className="block text-[10px] text-slate-400">
                        {pickup.preferredTime}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <StatusBadge status={pickup.status} />
                    </td>

                    {/* Action matching mockup green [Accept] button */}
                    <td className="py-4 px-6 text-right space-x-2">
                      {pickup.status === 'REQUESTED' && (
                        <button
                          onClick={() => handleAccept(pickup._id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                        >
                          Accept
                        </button>
                      )}

                      {pickup.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleMarkCollected(pickup._id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition disabled:opacity-50"
                        >
                          Mark Collected
                        </button>
                      )}

                      {pickup.status === 'COLLECTED' && (
                        <button
                          onClick={() => handleMarkReceived(pickup._id)}
                          disabled={actionLoading}
                          className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 shadow-sm transition disabled:opacity-50"
                        >
                          Check In Hub
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedPickup(pickup)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && <Pagination pagination={pagination} onPageChange={(page) => setPagination((current) => ({ ...current, page }))} />}
        </div>
      </div>

      {/* Pickup Details Modal */}
      {selectedPickup && (
        <Modal
          isOpen={!!selectedPickup}
          onClose={() => setSelectedPickup(null)}
          title={`Pickup Details - ${selectedPickup.pickupId}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Customer Name:</span>
                <span className="font-bold text-slate-800">{selectedPickup.user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-bold text-slate-800">{selectedPickup.contactNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Address:</span>
                <span className="font-bold text-slate-800 text-right">
                  {selectedPickup.address?.street}, {selectedPickup.address?.city} -{' '}
                  {selectedPickup.address?.pincode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Schedule:</span>
                <span className="font-bold text-slate-800">
                  {new Date(selectedPickup.preferredDate).toLocaleDateString()} (
                  {selectedPickup.preferredTime})
                </span>
              </div>
              {selectedPickup.notes && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Instructions:</span>
                  <span className="italic text-slate-700">"{selectedPickup.notes}"</span>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => navigate(`/track/${selectedPickup.device?.deviceId}`)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Track Device
              </button>
              <button
                onClick={() => setSelectedPickup(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default CollectorDashboard;
