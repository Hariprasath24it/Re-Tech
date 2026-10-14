import React from 'react';
import { CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';

const STANDARD_STAGES = [
  { key: 'REGISTERED', label: 'Device Registered' },
  { key: 'PICKUP_REQUESTED', label: 'Pickup Requested' },
  { key: 'ASSIGNED', label: 'Pickup Assigned' },
  { key: 'COLLECTED', label: 'Pickup Completed' },
  { key: 'RECEIVED', label: 'Device Received at Hub' },
  { key: 'UNDER_INSPECTION', label: 'Under Inspection' },
  { key: 'UNDER_REPAIR', label: 'Repair in Progress' },
  { key: 'REPAIRED', label: 'Repair Completed' },
  { key: 'QUALITY_CHECK', label: 'Quality Check' },
  { key: 'READY_FOR_REUSE', label: 'Ready for Reuse' },
  { key: 'REUSED', label: 'Reused' },
  { key: 'READY_FOR_RECYCLING', label: 'Ready for Recycling' },
  { key: 'RECYCLED', label: 'Recycled' },
];

const Timeline = ({ currentStatus, lifecycleHistory = [] }) => {
  // Map history events by stage or title
  const historyMap = {};
  lifecycleHistory.forEach((item) => {
    historyMap[item.stage] = item;
    historyMap[item.status] = item;
  });

  const getStageStatus = (stageKey, index) => {
    // If exact event exists in history, it is completed or current
    const isCompleted = lifecycleHistory.some(
      (h) => h.status === stageKey || h.stage?.toLowerCase().includes(stageKey.toLowerCase())
    );

    const isCurrent = currentStatus === stageKey;

    if (isCurrent) return 'current';
    if (isCompleted) return 'completed';
    return 'pending';
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {STANDARD_STAGES.map((step, idx) => {
        const state = getStageStatus(step.key, idx);
        const historyItem = historyMap[step.key] || historyMap[step.label];

        let iconNode = null;
        let textClass = 'text-slate-400';

        if (state === 'completed') {
          iconNode = (
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          );
          textClass = 'text-slate-800 font-semibold';
        } else if (state === 'current') {
          iconNode = (
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center animate-pulse ring-4 ring-emerald-100">
              <CircleDot className="w-4 h-4" />
            </div>
          );
          textClass = 'text-emerald-700 font-bold';
        } else {
          iconNode = (
            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-300 flex items-center justify-center">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
          );
        }

        return (
          <div key={step.key} className="relative flex items-start space-x-4">
            <div className="absolute -left-6 bg-white rounded-full p-0.5 z-10">
              {iconNode}
            </div>
            <div className="pt-0.5">
              <h4 className={`text-sm ${textClass}`}>{step.label}</h4>
              {historyItem ? (
                <div className="space-y-0.5 mt-0.5">
                  <p className="text-xs text-slate-500 font-medium">
                    {new Date(historyItem.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(historyItem.timestamp).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  {historyItem.description && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                      {historyItem.description}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Pending</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Timeline;
