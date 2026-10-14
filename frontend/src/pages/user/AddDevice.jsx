import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { deviceService } from '../../services/deviceService';
import {
  UploadCloud,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Truck,
} from 'lucide-react';

const CATEGORIES = [
  'Laptop',
  'Mobile Phone',
  'Desktop',
  'Monitor',
  'Television',
  'Printer',
  'Tablet',
  'Keyboard',
  'Mouse',
  'Charger',
  'Headphones',
  'Other',
];

const CONDITIONS = [
  'Working',
  'Partially Working',
  'Damaged',
  'Not Working',
];

const AddDevice = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: 'Laptop',
    brand: '',
    model: '',
    serialNumber: '',
    condition: 'Partially Working',
    issueDescription: '',
    purchaseYear: 2022,
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size exceeds 5MB limit.');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = new FormData();
      data.append('category', formData.category);
      data.append('brand', formData.brand);
      data.append('model', formData.model);
      data.append('serialNumber', formData.serialNumber);
      data.append('condition', formData.condition);
      data.append('issueDescription', formData.issueDescription);
      data.append('purchaseYear', formData.purchaseYear);

      if (selectedFile) {
        data.append('image', selectedFile);
      }

      const res = await deviceService.createDevice(data);
      if (res.success) {
        setSuccessResult(res);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to submit device. Please check details.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Add New Device"
      subtitle="Enter details about your e-waste device."
    >
      {/* Success Notification Modal / Banner */}
      {successResult ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl max-w-2xl mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-800">
              Device Registered Successfully!
            </h3>
            <p className="text-sm text-slate-500">
              Your device has been entered into the circular tracking pipeline.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-around">
            <div>
              <span className="text-xs text-emerald-700 block">Assigned Device ID</span>
              <span className="text-lg font-mono font-bold text-emerald-950">
                {successResult.device.deviceId}
              </span>
            </div>
            <div className="h-8 w-px bg-emerald-200" />
            <div>
              <span className="text-xs text-emerald-700 block">Reward Points Earned</span>
              <span className="text-lg font-bold text-emerald-700 flex items-center justify-center space-x-1">
                <Sparkles className="w-4 h-4" />
                <span>+{successResult.pointsAwarded} pts</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => navigate(`/user/pickup?deviceId=${successResult.device._id}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition"
            >
              <Truck className="w-4 h-4" />
              <span>Request Doorstep Pickup</span>
            </button>

            <button
              onClick={() => navigate(`/track/${successResult.device.deviceId}`)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm transition"
            >
              <span>View Tracking Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm max-w-4xl mx-auto">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Device Type Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Device Type *
                </label>
                <select
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Brand */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Brand *
                </label>
                <input
                  type="text"
                  name="brand"
                  required
                  value={formData.brand}
                  onChange={handleInputChange}
                  placeholder="e.g. Lenovo, Dell, Apple"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Model *
                </label>
                <input
                  type="text"
                  name="model"
                  required
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="e.g. LOQ, Inspiron 15, iPhone 11"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Condition Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Condition *
                </label>
                <select
                  name="condition"
                  required
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CONDITIONS.map((cond) => (
                    <option key={cond} value={cond}>
                      {cond}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Serial Number (Optional)
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. SN-883921"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Purchase Year */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Purchase Year
                </label>
                <input
                  type="number"
                  name="purchaseYear"
                  min={2000}
                  max={new Date().getFullYear()}
                  value={formData.purchaseYear}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Issue Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Issue Description
              </label>
              <textarea
                name="issueDescription"
                rows={3}
                value={formData.issueDescription}
                onChange={handleInputChange}
                placeholder="e.g. Battery not charging and display issue"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Upload Photos Section with Image Preview & Red Delete Button */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Upload Photos
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Upload Input Area */}
                <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-50/50">
                  <input
                    type="file"
                    id="device-photo"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="device-photo" className="cursor-pointer space-y-2 block">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">
                        Click to upload images
                      </p>
                      <p className="text-[11px] text-slate-400">PNG, JPG (Max 5MB)</p>
                    </div>
                  </label>
                </div>

                {/* Preview Thumbnail with red X matching the mockup */}
                {previewUrl ? (
                  <div className="relative w-44 h-36 rounded-2xl overflow-hidden border border-slate-200 shadow-sm mx-auto md:mx-0">
                    <img
                      src={previewUrl}
                      alt="Device preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 italic">
                    No image selected. Uploading photos helps technicians diagnose issues faster.
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                {submitting ? 'Registering Device...' : 'Submit Device'}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AddDevice;
