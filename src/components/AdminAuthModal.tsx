import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, X } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim().toUpperCase() === 'NFNAJMUL24') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('পাসওয়ার্ড ভুল হয়েছে! সঠিক এডমিন সিকিউরিটি কী ব্যবহার করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-sm bg-[#111827] border border-blue-500/30 rounded-3xl p-6 shadow-2xl shadow-blue-500/20 text-white space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-base font-extrabold tracking-wide text-white">
            NAFI TV 24 - Admin Portal
          </h2>
          <p className="text-xs text-slate-400">
            এডমিন অ্যাপে প্রবেশ করতে পাসওয়ার্ড বা সিকিউরিটি কী দিন
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter Security Password"
                autoFocus
                required
                className="w-full bg-black/50 border border-white/15 rounded-2xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all text-center tracking-widest font-mono"
              />
            </div>
            {error && (
              <p className="text-[11px] font-semibold text-red-400 text-center mt-1">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <span>এডমিন অ্যাপে প্রবেশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
