import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deviceService } from '../services/deviceService';
import Timeline from '../components/Timeline';
import StatusBadge from '../components/StatusBadge';
import QRCodeCard from '../components/QRCodeCard';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Package,
  Wrench,
  Truck,
  Recycle,
  CheckCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

const TrackDevice = () => {
  const { deviceId: urlDeviceId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [inputDeviceId, setInputDeviceId] = useState(urlDeviceId || 'RET-2026-0001');
  const [deviceData, setDeviceData] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlDeviceId) {
      handleSearch(urlDeviceId);
    } else {
      handleSearch('RET-2026-0001');
    }
  }, [urlDeviceId]);

  const handleSearch = async (searchId) => {
    const query = (searchId || inputDeviceId).trim().toUpperCase();
    if (!query) return;

    setError('');
    setLoading(true);

    try {
      const res = await deviceService.trackDevice(query);
      if (res.success) {
        setDeviceData(res.device);
        setDetails(res.details);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || `Device with ID "${query}" not found.`
      );
      setDeviceData(null);
      setDetails(null);
    } finally {
      setLoading(false);
    }
  };

  const onSearchSubmit = (e) => {
    e.preventDefault();
    if (inputDeviceId) {
      navigate(`/track/${inputDeviceId.trim().toUpperCase()}`);
    }
  };

  const Content = (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Search Card matching mockup */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
        <form onSubmit={onSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Enter Device ID (e.g. RET-2026-0001)"
              value={inputDeviceId}
              onChange={(e) => setInputDeviceId(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition shrink-0"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center space-x-2 mt-3 text-xs text-slate-400">
          <span>Try demo IDs:</span>
          {['RET-2026-0001', 'RET-2026-0002', 'RET-2026-0003', 'RET-2026-0004'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setInputDeviceId(id);
                navigate(`/track/${id}`);
              }}
              className="font-mono text-emerald-700 hover:underline bg-emerald-50 px-2 py-0.5 rounded"
            >
              {id}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200 flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {deviceData && (
        <div className="space-y-8">
          {/* Device Header Banner matching mockup */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-5 w-full md:w-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                {deviceData.image ? (
                  <img
                    src={deviceData.image}
                    alt={deviceData.model}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-8 h-8 text-emerald-700" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-black text-lg text-slate-900">
                    {deviceData.deviceId}
                  </span>
                  <StatusBadge status={deviceData.status} />
                </div>
                <h3 className="text-sm font-semibold text-slate-700 mt-0.5">
                  {deviceData.brand} {deviceData.model} ({deviceData.category})
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <div className="text-right text-xs">
                <span className="text-slate-400 block">Current Stage</span>
                <span className="font-bold text-emerald-800">
                  {deviceData.currentStage || 'In Progress'}
                </span>
              </div>
            </div>
          </div>

          {/* Grid: Vertical Stepper Timeline (Left) & QR Code + Diagnostic Details (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 cols: Vertical Timeline */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center space-x-2">
                <Package className="w-5 h-5 text-emerald-600" />
                <span>Device Lifecycle Timeline</span>
              </h3>

              <Timeline
                currentStatus={deviceData.status}
                lifecycleHistory={deviceData.lifecycleHistory || []}
              />
            </div>

            {/* Right 5 cols: QR Code & Detailed Specs */}
            <div className="lg:col-span-5 space-y-6">
              {/* QR Code Scannable Card */}
              <QRCodeCard
                deviceId={deviceData.deviceId}
                qrCodeBase64={deviceData.qrCode}
              />

              {/* Technical Inspection & Repair Details if available */}
              {details?.inspection && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Inspection Outcome
                  </h4>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Outcome</span>
                      <span className="font-bold text-emerald-700">{details.inspection.outcome}</span>
                    </div>
                    <p className="text-slate-500">
                      Recorded: {new Date(details.inspection.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              {/* Repair Progress & Costs if available */}
              {details?.repair && (
                <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Repair Progress
                  </h4>
                  <div className="text-xs space-y-2">
                    <p className="text-slate-700"><strong>Status:</strong> {details.repair.status}</p>
                    {details.repair.startedAt && (
                      <p className="text-slate-500">
                        Started: {new Date(details.repair.startedAt).toLocaleDateString()}
                      </p>
                    )}
                    {details.repair.completedAt && (
                      <p className="text-slate-500">
                        Completed: {new Date(details.repair.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Reuse Destination if available */}
              {details?.reuse && (
                <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 space-y-2 text-xs">
                  <h4 className="font-bold text-emerald-900">
                    🎉 Circular Second-Life Destination
                  </h4>
                  <p className="text-emerald-800">
                    <strong>Allocation:</strong> {details.reuse.reuseType}
                  </p>
                  <p className="text-emerald-800">
                    <strong>Allocated:</strong> {new Date(details.reuse.reuseDate).toLocaleDateString()}
                  </p>
                  <p className="text-emerald-700 text-[11px]">
                    Device has been allocated for reuse.
                  </p>
                </div>
              )}

              {/* Recycling Report if available */}
              {details?.recycling && (
                <div className="bg-teal-50 rounded-2xl p-5 border border-teal-200 space-y-2 text-xs">
                  <h4 className="font-bold text-teal-900">
                    ♻️ Certified Sustainable Recycling
                  </h4>
                  <p className="text-teal-800">
                    <strong>Status:</strong> {details.recycling.status}
                  </p>
                  <p className="text-teal-800">
                    <strong>Recorded:</strong> {new Date(details.recycling.recyclingDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // If user is logged in, show inside Dashboard layout; if public guest, show with Landing Navbar
  if (isAuthenticated) {
    return (
      <div className="flex min-h-screen bg-slate-50 font-sans">
        <Sidebar />
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="mb-6 flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Track Device</h2>
              <p className="text-xs text-slate-500">Track the current status of your device.</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
          {Content}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 p-8 md:p-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            E-Waste Lifecycle Tracking
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status transparency from pickup to repair, reuse, and recycling.
          </p>
        </div>
        {Content}
      </div>
    </div>
  );
};

export default TrackDevice;
