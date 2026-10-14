import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deviceService } from '../../services/deviceService';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import QRCodeCard from '../../components/QRCodeCard';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import {
  Package,
  Plus,
  Truck,
  QrCode,
} from 'lucide-react';

const MyDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [selectedQRDevice, setSelectedQRDevice] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDevices();
  }, [searchTerm, statusFilter, categoryFilter, fromDate, toDate, sort, pagination.page]);

  const fetchDevices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await deviceService.getMyDevices({
        search: searchTerm || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
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
      console.error('Error fetching devices:', err);
      setError(err.response?.data?.message || 'Devices could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout
      title="My E-Waste Devices"
      subtitle="View, track, and manage all electronic items you've submitted."
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FilterBar
          search={searchTerm}
          onSearchChange={(value) => { setSearchTerm(value); setPagination((current) => ({ ...current, page: 1 })); }}
          searchPlaceholder="Search by ID, brand, model..."
          filters={[
            { name: 'status', label: 'Status', value: statusFilter, onChange: (value) => { setStatusFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
              { value: 'ALL', label: 'All statuses' }, { value: 'REGISTERED', label: 'Registered' },
              { value: 'PICKUP_REQUESTED', label: 'Pickup pending' }, { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'COLLECTED', label: 'Collected' }, { value: 'RECEIVED', label: 'Received' },
              { value: 'UNDER_INSPECTION', label: 'Under inspection' }, { value: 'UNDER_REPAIR', label: 'Under repair' },
              { value: 'REPAIRED', label: 'Repaired' }, { value: 'QUALITY_CHECK', label: 'Quality check' },
              { value: 'READY_FOR_REUSE', label: 'Ready for reuse' }, { value: 'REUSED', label: 'Reused' },
              { value: 'READY_FOR_RECYCLING', label: 'Ready for recycling' }, { value: 'RECYCLED', label: 'Recycled' },
            ] },
            { name: 'category', label: 'Category', value: categoryFilter, onChange: (value) => { setCategoryFilter(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
              { value: 'ALL', label: 'All categories' }, { value: 'Laptop', label: 'Laptop' },
              { value: 'Mobile Phone', label: 'Mobile Phone' }, { value: 'Tablet', label: 'Tablet' },
              { value: 'Desktop', label: 'Desktop' }, { value: 'Monitor', label: 'Monitor' },
              { value: 'Printer', label: 'Printer' }, { value: 'Other', label: 'Other' },
            ] },
          ]}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
          onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
          sort={sort}
          sortOptions={[{ value: '-createdAt', label: 'Newest first' }, { value: 'createdAt', label: 'Oldest first' }, { value: 'deviceId', label: 'Device ID' }]}
          onSortChange={(value) => { setSort(value); setPagination((current) => ({ ...current, page: 1 })); }}
          onClear={() => {
            setSearchTerm(''); setStatusFilter('ALL'); setCategoryFilter('ALL');
            setFromDate(''); setToDate(''); setSort('-createdAt');
            setPagination((current) => ({ ...current, page: 1 }));
          }}
        />
        <ErrorNotice message={error} />
        <Link
          to="/user/add-device"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Another Device</span>
        </Link>
      </div>

      {/* Devices List Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">No matching devices found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Condition</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Submitted On</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {devices.map((device) => (
                  <tr key={device._id} className="hover:bg-slate-50/60 transition">
                    {/* Device Details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {device.image ? (
                            <img
                              src={device.image}
                              alt={device.model}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {device.brand} {device.model}
                          </p>
                          <p className="text-[11px] text-slate-500">{device.category}</p>
                          <span className="font-mono text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                            {device.deviceId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Condition */}
                    <td className="py-4 px-6">
                      <span className="font-medium text-slate-700">{device.condition}</span>
                      {device.issueDescription && (
                        <p className="text-[11px] text-slate-400 max-w-xs truncate">
                          {device.issueDescription}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <StatusBadge status={device.status} />
                    </td>

                    {/* Submitted Date */}
                    <td className="py-4 px-6 text-slate-500">
                      {new Date(device.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Action buttons */}
                    <td className="py-4 px-6 text-right space-x-2">
                      {device.status === 'REGISTERED' && (
                        <Link
                          to={`/user/pickup?deviceId=${device._id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span>Pickup</span>
                        </Link>
                      )}

                      <button
                        onClick={() => setSelectedQRDevice(device)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition inline-flex items-center"
                        title="Show QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => navigate(`/track/${device.deviceId}`)}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-900 text-white transition"
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

      {/* QR Code Modal */}
      {selectedQRDevice && (
        <Modal
          isOpen={!!selectedQRDevice}
          onClose={() => setSelectedQRDevice(null)}
          title={`Tracking QR - ${selectedQRDevice.brand} ${selectedQRDevice.model}`}
        >
          <QRCodeCard
            deviceId={selectedQRDevice.deviceId}
            qrCodeBase64={selectedQRDevice.qrCode}
          />
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default MyDevices;
