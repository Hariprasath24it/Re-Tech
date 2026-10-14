import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { technicianService } from '../../services/technicianService';
import FilterBar from '../../components/FilterBar';
import Pagination from '../../components/Pagination';
import ErrorNotice from '../../components/ErrorNotice';
import { ShieldCheck, Calendar, User, Wrench, Repeat, Recycle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const InspectionPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [outcome, setOutcome] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    fetchInspections();
  }, [search, outcome, fromDate, toDate, pagination.page]);

  const fetchInspections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await technicianService.getAllInspections({
        search: search || undefined,
        outcome: outcome === 'ALL' ? undefined : outcome,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
      });
      if (res.success) {
        setInspections(res.inspections || []);
        setPagination((current) => ({ ...current, ...(res.pagination || {}) }));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Inspections could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const getOutcomeBadge = (outcome) => {
    switch (outcome) {
      case 'REPAIR':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
            <Wrench className="w-3 h-3" />
            <span>REPAIR</span>
          </span>
        );
      case 'REUSE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Repeat className="w-3 h-3" />
            <span>REUSE</span>
          </span>
        );
      case 'RECYCLE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
            <Recycle className="w-3 h-3" />
            <span>RECYCLE</span>
          </span>
        );
      default:
        return outcome;
    }
  };

  return (
    <DashboardLayout
      title="Hardware Diagnostic Logs"
      subtitle="Complete database of technical evaluations and triage decisions."
    >
      <FilterBar
        search={search}
        onSearchChange={(value) => { setSearch(value); setPagination((current) => ({ ...current, page: 1 })); }}
        searchPlaceholder="Search inspection ID or device..."
        filters={[{ name: 'outcome', label: 'Outcome', value: outcome, onChange: (value) => { setOutcome(value); setPagination((current) => ({ ...current, page: 1 })); }, options: [
          { value: 'ALL', label: 'All outcomes' }, { value: 'REPAIR', label: 'Repair' },
          { value: 'REUSE', label: 'Reuse' }, { value: 'RECYCLE', label: 'Recycle' },
        ] }]}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={(value) => { setFromDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onToDateChange={(value) => { setToDate(value); setPagination((current) => ({ ...current, page: 1 })); }}
        onClear={() => { setSearch(''); setOutcome('ALL'); setFromDate(''); setToDate(''); setPagination((current) => ({ ...current, page: 1 })); }}
      />
      <ErrorNotice message={error} />
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-800">
            Recorded Inspections ({pagination.total})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading inspection records...</div>
        ) : inspections.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No inspections logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Inspection ID</th>
                  <th className="py-4 px-6">Device</th>
                  <th className="py-4 px-6">Technician</th>
                  <th className="py-4 px-6">Condition & Findings</th>
                  <th className="py-4 px-6">Est. Cost</th>
                  <th className="py-4 px-6">Outcome</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inspections.map((insp) => (
                  <tr key={insp._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-4 px-6 font-mono font-bold text-slate-700">
                      {insp.inspectionId}
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">
                        {insp.device?.brand} {insp.device?.model}
                      </p>
                      <p className="font-mono text-[10px] text-emerald-700">{insp.device?.deviceId}</p>
                    </td>

                    <td className="py-4 px-6 text-slate-600 font-medium">
                      {insp.technician?.name || 'Technician'}
                    </td>

                    <td className="py-4 px-6 max-w-xs">
                      <p className="text-slate-800 font-semibold">{insp.deviceCondition}</p>
                      {insp.notes && <p className="text-[11px] text-slate-400 italic">"{insp.notes}"</p>}
                    </td>

                    <td className="py-4 px-6 font-bold text-slate-800">
                      ₹{insp.estimatedRepairCost || 0}
                    </td>

                    <td className="py-4 px-6">{getOutcomeBadge(insp.outcome)}</td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/track/${insp.device?.deviceId}`)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 font-semibold"
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

export default InspectionPage;
