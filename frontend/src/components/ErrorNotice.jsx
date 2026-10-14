import React from 'react';
import { AlertCircle } from 'lucide-react';

const ErrorNotice = ({ message }) => {
  if (!message) return null;

  return (
    <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};

export default ErrorNotice;