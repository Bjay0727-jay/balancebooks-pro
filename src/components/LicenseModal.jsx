import { useState } from 'react';
import Modal from './Modal';
import { useAppStore } from '../stores/useAppStore';
import { Key, Mail, Check, AlertTriangle, Loader2, Crown, Unlock } from 'lucide-react';

const PRO_FEATURES = [
  'Unlimited transactions',
  'Dropbox cloud sync',
  'Debt payoff planner',
  'Advanced analytics',
  'Priority support',
];

export default function LicenseModal({ onClose }) {
  const licenseStatus = useAppStore(s => s.licenseStatus);
  const licenseEmail = useAppStore(s => s.licenseEmail);
  const licenseExpiry = useAppStore(s => s.licenseExpiry);
  const licenseError = useAppStore(s => s.licenseError);
  const licenseActivating = useAppStore(s => s.licenseActivating);
  const activateLicense = useAppStore(s => s.activateLicense);
  const deactivateLicense = useAppStore(s => s.deactivateLicense);

  const [inputKey, setInputKey] = useState('');
  const [inputEmail, setInputEmail] = useState('');

  const isActive = licenseStatus === 'active';

  const handleActivate = async () => {
    if (!inputKey.trim() || !inputEmail.trim()) return;
    await activateLicense(inputKey.trim(), inputEmail.trim());
  };

  return (
    <Modal title={isActive ? 'License Active' : 'Activate Premium'} onClose={onClose}>
      <div className="space-y-4">
        {!isActive ? (
          <>
            {/* Feature list */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
              <p className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <Crown size={16} /> Premium Features
              </p>
              <ul className="space-y-1.5">
                {PRO_FEATURES.map(f => (
                  <li key={f} className="text-sm text-purple-700 flex items-center gap-2">
                    <Check size={14} className="text-purple-500" /> {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Input fields */}
            <div>
              <label className="block text-sm text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                <Key size={14} /> License Key
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                disabled={licenseActivating}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00b4d8] focus:outline-none disabled:bg-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-600 font-medium mb-1.5 flex items-center gap-1.5">
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={inputEmail}
                onChange={e => setInputEmail(e.target.value)}
                disabled={licenseActivating}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00b4d8] focus:outline-none disabled:bg-slate-100"
              />
            </div>

            {licenseError && (
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-200">
                <p className="text-sm text-rose-600 flex items-center gap-2">
                  <AlertTriangle size={14} /> {licenseError}
                </p>
              </div>
            )}

            <button
              onClick={handleActivate}
              disabled={licenseActivating || !inputKey.trim() || !inputEmail.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#12233d] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg disabled:opacity-50"
            >
              {licenseActivating ? (
                <><Loader2 size={18} className="animate-spin" /> Activating...</>
              ) : (
                <><Unlock size={18} /> Activate License</>
              )}
            </button>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-300">
              <div className="flex items-center gap-2 mb-2">
                <Check size={20} className="text-green-600" />
                <p className="font-semibold text-green-800">Premium Active</p>
              </div>
              <p className="text-sm text-green-700">Thank you for supporting Balance Books Pro!</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
              <div>
                <p className="text-slate-500 font-medium">Licensed to</p>
                <p className="text-slate-900 font-semibold">{licenseEmail}</p>
              </div>
              {licenseExpiry && (
                <div>
                  <p className="text-slate-500 font-medium">Expires</p>
                  <p className="text-slate-900">{new Date(licenseExpiry).toLocaleDateString()}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => { deactivateLicense(); onClose(); }}
              className="w-full py-2.5 bg-rose-50 text-rose-600 rounded-xl font-medium hover:bg-rose-100 border border-rose-200"
            >
              Deactivate License
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
