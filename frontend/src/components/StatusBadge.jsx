import React from 'react';

const StatusBadge = ({ status }) => {
  const getBadgeStyle = (s) => {
    switch (s?.toUpperCase()) {
      case 'UNDER_REPAIR':
      case 'UNDER REPAIR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'REPAIRED':
      case 'QUALITY_CHECK':
      case 'QUALITY CHECK':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'READY_FOR_REUSE':
      case 'REUSED':
      case 'READY FOR REUSE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'READY_FOR_RECYCLING':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'RECYCLED':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'PICKUP_REQUESTED':
      case 'REQUESTED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ASSIGNED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'COLLECTED':
      case 'RECEIVED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'REGISTERED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatText = (s) => {
    if (!s) return 'Unknown';
    return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle(
        status
      )}`}
    >
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
