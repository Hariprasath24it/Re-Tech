import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { rewardService } from '../../services/rewardService';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import {
  Award,
  Sparkles,
  Smartphone,
  Laptop,
  Recycle,
  Repeat,
  Ticket,
  Truck,
  Wrench,
  Gift,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

const UserRewards = () => {
  const { user } = useAuth();
  const [rewardData, setRewardData] = useState({
    currentPoints: user?.rewardPoints || 0,
    catalog: [],
    history: [],
  });
  const [loading, setLoading] = useState(true);
  const [redeemingItem, setRedeemingItem] = useState(null);
  const [redeemedCode, setRedeemedCode] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const res = await rewardService.getMyRewards();
      if (res.success) {
        setRewardData(res);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardItem) => {
    setError('');
    setSubmitting(true);

    try {
      const res = await rewardService.redeemReward(rewardItem.id);
      if (res.success) {
        setRedeemedCode(res.redeemCode);
        setRedeemingItem(rewardItem);
        // Refresh balance & history
        fetchRewards();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Redemption failed. Check your point balance.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getItemIcon = (id) => {
    switch (id) {
      case 'rew_1':
        return <Ticket className="w-5 h-5 text-red-500" />;
      case 'rew_2':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'rew_3':
        return <Wrench className="w-5 h-5 text-amber-500" />;
      case 'rew_4':
        return <Gift className="w-5 h-5 text-emerald-500" />;
      default:
        return <Award className="w-5 h-5 text-emerald-500" />;
    }
  };

  return (
    <DashboardLayout
      title="Rewards & Eco-Impact"
      subtitle="Earn points by contributing e-waste and helping the environment."
    >
      {/* Top Banner Card matching mockup */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="max-w-xl space-y-4">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Eco Loyalty Points Balance</span>
          </div>

          <div className="flex items-baseline space-x-3">
            <span className="text-5xl font-black text-slate-900">
              {rewardData.currentPoints}
            </span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              Total Points
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-md">
            Your points are earned from submitting e-waste, repairing equipment, and diverting hazardous metals from landfills.
          </p>
        </div>

        {/* Decorative Green Leaf Graphic / Motif on Right */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-emerald-50/60 -z-0 flex items-center justify-center text-emerald-200">
          <svg className="w-36 h-36" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid: How to Earn (Left) & Available Rewards (Right) matching UI image */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: How to Earn matching mockup */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-800">How to Earn</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Donate old mobile</h4>
                  <p className="text-[11px] text-slate-400">Phone submission</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                50 points
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Donate laptop</h4>
                  <p className="text-[11px] text-slate-400">Laptop / Desktop</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                100 points
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Recycle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Send device for recycling</h4>
                  <p className="text-[11px] text-slate-400">Zero landfill processing</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                75 points
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Donate reusable device</h4>
                  <p className="text-[11px] text-slate-400">Working order hardware</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                150 points
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Available Rewards matching mockup */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-800">Available Rewards</h3>

          <div className="space-y-4">
            {rewardData.catalog?.map((item) => {
              const canRedeem = (rewardData.currentPoints || 0) >= item.cost;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-300 transition"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                      {getItemIcon(item.id)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                      <span className="text-[11px] font-semibold text-emerald-700">
                        {item.cost} points required
                      </span>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={() => handleRedeem(item)}
                      disabled={!canRedeem || submitting}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                        canRedeem
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {submitting ? 'Processing...' : 'Redeem'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Redemption Success Modal */}
      {redeemingItem && redeemedCode && (
        <Modal
          isOpen={true}
          onClose={() => {
            setRedeemingItem(null);
            setRedeemedCode('');
          }}
          title="Reward Claimed Successfully! 🎉"
        >
          <div className="text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-800">{redeemingItem.title}</h4>
              <p className="text-xs text-slate-500">{redeemingItem.description}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Your Redemption Voucher Code
              </span>
              <div className="flex items-center justify-center space-x-2">
                <span className="font-mono text-base font-black text-emerald-950 tracking-wider">
                  {redeemedCode}
                </span>
                <button
                  onClick={() => copyToClipboard(redeemedCode)}
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-500"
                  title="Copy code"
                >
                  {copiedCode ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setRedeemingItem(null);
                setRedeemedCode('');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
            >
              Done
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
};

export default UserRewards;
