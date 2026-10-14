import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deviceService } from '../../services/deviceService';
import { pickupService } from '../../services/pickupService';
import { useAuth } from '../../context/AuthContext';
import {
  Truck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  Package,
} from 'lucide-react';

const RequestPickup = () => {
  const [searchParams] = useSearchParams();
  const preselectedDeviceId = searchParams.get('deviceId');

  const { user } = useAuth();
  const navigate = useNavigate();

  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(preselectedDeviceId || '');
  const [formData, setFormData] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    pincode: user?.address?.pincode || '',
    preferredDate: '',
    preferredTime: 'Morning (09:00 AM - 12:00 PM)',
    contactNumber: user?.phone || '',
    notes: '',
  });

  const [loadingDevices, setLoadingDevices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchEligibleDevices = async () => {
      try {
        const res = await deviceService.getMyDevices();
        if (res.success) {
          // Filter to devices in REGISTERED status
          const eligible = res.devices.filter(
            (d) => d.status === 'REGISTERED' || d._id === preselectedDeviceId
          );
          setDevices(eligible);
          if (preselectedDeviceId) {
            setSelectedDevice(preselectedDeviceId);
          } else if (eligible.length > 0) {
            setSelectedDevice(eligible[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching eligible devices:', err);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchEligibleDevices();
  }, [preselectedDeviceId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDevice) {
      setError('Please select a registered device for pickup.');
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await pickupService.createPickup({
        deviceId: selectedDevice,
        address: {
          street: formData.street,
          city: formData.city,
          pincode: formData.pincode,
        },
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        contactNumber: formData.contactNumber,
        notes: formData.notes,
      });

      if (res.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to request pickup. Please check inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Min date is tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split('T')[0];

  return (
    <DashboardLayout
      title="Schedule Doorstep Pickup"
      subtitle="Our verified collection agents will collect your e-waste from your doorstep."
    >
      {success ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl max-w-xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">
              Pickup Scheduled!
            </h3>
            <p className="text-sm text-slate-500">
              A collection agent in your district has been notified and will coordinate with you.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs text-emerald-800 space-y-1">
            <p>
              <strong>Scheduled Date:</strong> {formData.preferredDate} ({formData.preferredTime})
            </p>
            <p>
              <strong>Pickup Address:</strong> {formData.street}, {formData.city} - {formData.pincode}
            </p>
          </div>

          <div className="pt-2 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/user/dashboard')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => navigate('/user/devices')}
              className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
            >
              View My Devices
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {devices.length === 0 && !loadingDevices ? (
            <div className="text-center py-10 space-y-4">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-base font-bold text-slate-700">
                No Registered Devices Available for Pickup
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                You must register an e-waste device first before booking a collection slot.
              </p>
              <button
                onClick={() => navigate('/user/add-device')}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-md transition"
              >
                Register a Device First
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Device Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Select Device for Pickup *
                </label>
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose from your submitted devices --</option>
                  {devices.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.category} - {d.brand} {d.model} ({d.deviceId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Preferred Pickup Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      name="preferredDate"
                      min={minDateStr}
                      required
                      value={formData.preferredDate}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    Preferred Time Slot *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Morning (09:00 AM - 12:00 PM)">
                        Morning (09:00 AM - 12:00 PM)
                      </option>
                      <option value="Afternoon (01:00 PM - 04:00 PM)">
                        Afternoon (01:00 PM - 04:00 PM)
                      </option>
                      <option value="Evening (04:00 PM - 07:00 PM)">
                        Evening (04:00 PM - 07:00 PM)
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Doorstep Collection Address</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street Address / Flat / Building *
                  </label>
                  <input
                    type="text"
                    name="street"
                    required
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="42, 2nd Main Road"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City / Area *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Anna Nagar, Chennai"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="600040"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contact Phone Number for Driver *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      name="contactNumber"
                      required
                      value={formData.contactNumber}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pickup Instructions / Landmarks (Optional)
                  </label>
                  <textarea
                    name="notes"
                    rows={2}
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="e.g. Call 10 mins before reaching; gate code 402"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
                >
                  {submitting ? 'Confirming Booking...' : 'Confirm Pickup Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default RequestPickup;
