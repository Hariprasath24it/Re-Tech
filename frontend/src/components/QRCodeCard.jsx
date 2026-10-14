import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, ExternalLink } from 'lucide-react';

const QRCodeCard = ({ deviceId, qrCodeBase64 }) => {
  const [copied, setCopied] = useState(false);
  const clientUrl = (import.meta.env.VITE_CLIENT_URL || window.location.origin).replace(/\/+$/, '');
  const trackingUrl = `${clientUrl}/track/${encodeURIComponent(deviceId)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(trackingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center flex flex-col items-center">
      <div className="flex items-center justify-center space-x-2 text-emerald-800 font-semibold mb-3">
        <QrCode className="w-5 h-5 text-emerald-600" />
        <span>Device Tracking QR</span>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 inline-block mb-3 shadow-inner">
        {qrCodeBase64 ? (
          <img
            src={qrCodeBase64}
            alt={`QR Code for ${deviceId}`}
            className="w-36 h-36 mx-auto rounded-lg object-contain"
          />
        ) : (
          <QRCodeSVG
            value={trackingUrl}
            size={144}
            level="H"
            includeMargin={true}
            fgColor="#0d382c"
          />
        )}
      </div>

      <p className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full mb-3">
        {deviceId}
      </p>

      <p className="text-xs text-slate-500 mb-4 max-w-xs">
        Scan this QR code with any mobile camera to view real-time e-waste repair & reuse lifecycle status.
      </p>

      <div className="flex items-center space-x-2 w-full">
        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Copied Link</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        <a
          href={trackingUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          title="Open tracking page"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};

export default QRCodeCard;
