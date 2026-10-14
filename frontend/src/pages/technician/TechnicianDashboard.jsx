import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deviceService } from '../../services/deviceService';
import { technicianService } from '../../services/technicianService';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import {
  Package,
  Wrench,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Laptop,
  Printer,
  Monitor,
  Repeat,
  Recycle,
  Sparkles,
} from 'lucide-react';

const TechnicianDashboard = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [underRepairCount, setUnderRepairCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [inspectingDevice, setInspectingDevice] = useState(null);
  const [submittingInspection, setSubmittingInspection] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Diagnostic form state
  const [inspectionForm, setInspectionForm] = useState({
    deviceCondition: 'Partially Working - Salvageable',
    physicalDamage: 'Minor Scratches',
    batteryCondition: 'Degraded',
    displayCondition: 'Scratched',
    motherboardCondition: 'Working',
    storageCondition: 'Healthy',
    ramCondition: 'Working',
    otherIssues: '',
    estimatedRepairCost: 800,
    repairPossible: true,
    reusePossible: true,
    recyclingRequired: false,
    outcome: 'REPAIR', // 'REPAIR' | 'REUSE' | 'RECYCLE'
    notes: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchTechnicianData();
  }, [pagination.page]);

  const fetchTechnicianData = async () => {
    setLoading(true);
    setError('');
    try {
      const [devRes, repairRes, reusedRes, recycledRes] = await Promise.all([
        deviceService.getAllDevices({ status: 'COLLECTED,RECEIVED,REGISTERED,PICKUP_REQUESTED', page: pagination.page, limit: pagination.limit, sort: '-createdAt' }),
        deviceService.getAllDevices({ status: 'UNDER_REPAIR', page: 1, limit: 1 }),
        deviceService.getAllDevices({ status: 'REUSED', page: 1, limit: 1 }),
        deviceService.getAllDevices({ status: 'RECYCLED', page: 1, limit: 1 }),
      ]);
      if (devRes.success) {
        setDevices(devRes.devices || []);
        setPagination((current) => ({ ...current, ...(devRes.pagination || {}) }));
        setUnderRepairCount(repairRes.pagination?.total || 0);
        setCompletedCount((reusedRes.pagination?.total || 0) + (recycledRes.pagination?.total || 0));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Technician work queues could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  // Metric counts matching the mockup
  const pendingDevices = devices;
  const handleOpenInspect = (device) => {
    setInspectingDevice(device);
    setInspectionForm({
      deviceCondition: device.condition || 'Partially Working',
      physicalDamage: 'Minor Scratches',
      batteryCondition: 'Degraded',
      displayCondition: 'Scratched',
      motherboardCondition: 'Working',
      storageCondition: 'Healthy',
      ramCondition: 'Working',
      otherIssues: device.issueDescription || '',
      estimatedRepairCost: 800,
      repairPossible: true,
      reusePossible: true,
      recyclingRequired: false,
      outcome: 'REPAIR',
      notes: '',
    });
  };

  const handleInspectionSubmit = async (e) => {
    e.preventDefault();
    setSubmittingInspection(true);

    try {
      const res = await technicianService.createInspection({
        deviceId: inspectingDevice._id,
        ...inspectionForm,
      });

      if (res.success) {
        // If technician chose REPAIR, automatically initiate a repair record
        if (inspectionForm.outcome === 'REPAIR') {
          await technicianService.createRepair({
            deviceId: inspectingDevice._id,
            problem: inspectingDevice.issueDescription || 'Hardware failure',
            diagnosis: `Diagnostic completed. ${inspectionForm.notes || 'Parts replacement required.'}`,
            partsCost: Math.round(Number(inspectionForm.estimatedRepairCost) * 0.6),
            labourCost: Math.round(Number(inspectionForm.estimatedRepairCost) * 0.4),
            partsRequired: [{ partName: 'Replacement Components', cost: Math.round(Number(inspectionForm.estimatedRepairCost) * 0.6) }],
            notes: inspectionForm.notes,
          });
        }

        // If technician chose REUSE
        if (inspectionForm.outcome === 'REUSE') {
          await technicianService.createReuse({
            deviceId: inspectingDevice._id,
            reuseType: 'Donate',
            conditionAfterRepair: 'Refurbished - Grade A Certified',
            estimatedValue: 12000,
            finalDestination: 'Local Community Educational Center',
            notes: inspectionForm.notes,
          });
        }

        // If technician chose RECYCLE
        if (inspectionForm.outcome === 'RECYCLE') {
          await technicianService.createRecycling({
            deviceId: inspectingDevice._id,
            partner: 'CleanEarth Green Refineries Ltd.',
            weightKg: 2.4,
            notes: inspectionForm.notes,
          });
        }

        setFeedbackMsg(`Diagnosis recorded successfully! Outcome designated: ${inspectionForm.outcome}`);
        setInspectingDevice(null);
        setTimeout(() => setFeedbackMsg(''), 4000);
        fetchTechnicianData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Inspection recording failed.');
    } finally {
      setSubmittingInspection(false);
    }
  };

  return (
    <DashboardLayout
      title="Diagnostics & Repair Workshop"
      subtitle="Examine hardware, log component testing, and designate reuse/repair/recycling paths."
    >
      <ErrorNotice message={error} />
      {/* 3 Metric Cards matching technician mockup: 5 Pending, 3 Under Repair, 8 Completed */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{pagination.total}</h3>
            <p className="text-xs font-medium text-slate-500">Pending Inspection</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{underRepairCount}</h3>
            <p className="text-xs font-medium text-slate-500">Under Repair</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{completedCount}</h3>
            <p className="text-xs font-medium text-slate-500">Completed (Reused/Recycled)</p>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Pending Devices Table matching mockup */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800">Pending Devices</h3>
            <p className="text-xs text-slate-400">
              Hardware received at hub awaiting technician diagnostic evaluation.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full">
            {pagination.total} Awaiting Inspection
          </span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading devices...</div>
          ) : pendingDevices.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No devices currently awaiting inspection.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6 w-12">#</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Reported Issue</th>
                  <th className="py-4 px-6">Current Status</th>
                  <th className="py-4 px-6">Received On</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingDevices.map((d, index) => (
                  <tr key={d._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono text-slate-400">{index + 1}</td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {d.image ? (
                            <img src={d.image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-emerald-700" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{d.category}</p>
                          <p className="text-[11px] text-slate-500">
                            {d.brand} {d.model}
                          </p>
                          <span className="font-mono text-[10px] text-emerald-700 font-semibold">
                            {d.deviceId}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-slate-600">
                      {d.issueDescription || (
                        <span className="text-slate-400 italic">No description provided</span>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={d.status} />
                    </td>

                    <td className="py-4 px-6 text-slate-500">
                      {new Date(d.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenInspect(d)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
                      >
                        Inspect
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

      {/* Device Inspection Modal Dialog */}
      {inspectingDevice && (
        <Modal
          isOpen={!!inspectingDevice}
          onClose={() => setInspectingDevice(null)}
          title={`Diagnostic Inspection: ${inspectingDevice.brand} ${inspectingDevice.model} (${inspectingDevice.deviceId})`}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleInspectionSubmit} className="space-y-5 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800">
                  {inspectingDevice.category} - {inspectingDevice.brand} {inspectingDevice.model}
                </p>
                <p className="text-slate-500 text-[11px]">
                  User issue note: "{inspectingDevice.issueDescription || 'None'}"
                </p>
              </div>
              <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                {inspectingDevice.deviceId}
              </span>
            </div>

            {/* Diagnostic Matrix Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Physical Shell Damage
                </label>
                <select
                  value={inspectionForm.physicalDamage}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, physicalDamage: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="None">None (Flawless)</option>
                  <option value="Minor Scratches">Minor Scratches</option>
                  <option value="Moderate Cracks">Moderate Cracks</option>
                  <option value="Severe Structural Damage">Severe Damage</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Battery Condition
                </label>
                <select
                  value={inspectionForm.batteryCondition}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, batteryCondition: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Good">Good (&gt;80% capacity)</option>
                  <option value="Degraded">Degraded (50-80%)</option>
                  <option value="Dead">Dead (Needs replacement)</option>
                  <option value="Missing">Missing</option>
                  <option value="N/A">N/A (No battery)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Display / Screen
                </label>
                <select
                  value={inspectionForm.displayCondition}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, displayCondition: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Flawless">Flawless</option>
                  <option value="Scratched">Scratched</option>
                  <option value="Cracked Screen">Cracked Glass</option>
                  <option value="Dead Pixels / No Display">Dead Pixels / No Display</option>
                  <option value="N/A">N/A</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motherboard / Logic Board
                </label>
                <select
                  value={inspectionForm.motherboardCondition}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, motherboardCondition: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Working">Working</option>
                  <option value="Minor Circuit Fault">Minor Circuit Fault</option>
                  <option value="Burnt / Damaged">Burnt / Irreparable</option>
                  <option value="Untested">Untested</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Internal Storage
                </label>
                <select
                  value={inspectionForm.storageCondition}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, storageCondition: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="Healthy">Healthy (Sanitized)</option>
                  <option value="Bad Sectors">Bad Sectors</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Removed / Sanitized">Removed / Shredded</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Estimated Repair Cost (₹)
                </label>
                <input
                  type="number"
                  value={inspectionForm.estimatedRepairCost}
                  onChange={(e) =>
                    setInspectionForm({ ...inspectionForm, estimatedRepairCost: e.target.value })
                  }
                  className="w-full p-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>

            {/* Crucial Outcome Selector matching Section 10 of prompt */}
            <div className="pt-3 border-t border-slate-100">
              <label className="block text-sm font-bold text-slate-800 mb-2">
                Designate Circular Outcome *
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center transition ${
                    inspectionForm.outcome === 'REPAIR'
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400 font-bold text-amber-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="REPAIR"
                    checked={inspectionForm.outcome === 'REPAIR'}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, outcome: e.target.value })}
                    className="hidden"
                  />
                  <Wrench className="w-5 h-5 text-amber-600 mb-1" />
                  <span>REPAIR</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Fix parts & restore
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center transition ${
                    inspectionForm.outcome === 'REUSE'
                      ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400 font-bold text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="REUSE"
                    checked={inspectionForm.outcome === 'REUSE'}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, outcome: e.target.value })}
                    className="hidden"
                  />
                  <Repeat className="w-5 h-5 text-emerald-600 mb-1" />
                  <span>REUSE</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Direct donation / resale
                  </span>
                </label>

                <label
                  className={`p-3.5 rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center transition ${
                    inspectionForm.outcome === 'RECYCLE'
                      ? 'bg-teal-50 border-teal-400 ring-2 ring-teal-400 font-bold text-teal-900'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="outcome"
                    value="RECYCLE"
                    checked={inspectionForm.outcome === 'RECYCLE'}
                    onChange={(e) => setInspectionForm({ ...inspectionForm, outcome: e.target.value })}
                    className="hidden"
                  />
                  <Recycle className="w-5 h-5 text-teal-600 mb-1" />
                  <span>RECYCLE</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Dismantle materials
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Technician Diagnostic Notes
              </label>
              <textarea
                rows={2}
                value={inspectionForm.notes}
                onChange={(e) =>
                  setInspectionForm({ ...inspectionForm, notes: e.target.value })
                }
                placeholder="Detail the failure point, required IC chip, or recommended donation recipient..."
                className="w-full p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setInspectingDevice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingInspection}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md transition disabled:opacity-50"
              >
                {submittingInspection ? 'Submitting...' : 'Save Diagnosis & Proceed'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default TechnicianDashboard;
