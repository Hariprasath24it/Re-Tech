import React from 'react';

const Pagination = ({ pagination, onPageChange }) => {
  const page = pagination?.page || 1;
  const totalPages = Math.max(1, pagination?.totalPages || 1);
  const total = pagination?.total || 0;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
      <span>{total} {total === 1 ? 'result' : 'results'} | Page {page} of {totalPages}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;