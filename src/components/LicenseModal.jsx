import Modal from './Modal';
import { useAppStore } from '../stores/useAppStore';
import { Check, Crown, ExternalLink } from 'lucide-react';

const PRO_FEATURES = [
  'Unlimited transactions',
  'Dropbox cloud sync',
  'Debt payoff planner',
  'Advanced analytics',
  'Priority support',
];

const STRIPE_CHECKOUT_URL = import.meta.env.VITE_STRIPE_CHECKOUT_URL || 'https://www.balancebooksapp.com/checkout.html?product=pro';

export default function LicenseModal({ onClose }) {
  const licenseStatus = useAppStore(s => s.licenseStatus);
  const licenseEmail = useAppStore(s => s.licenseEmail);
  const licenseExpiry = useAppStore(s => s.licenseExpiry);
  const deactivateLicense = useAppStore(s => s.deactivateLicense);

  const isActive = licenseStatus === 'active';

  return (
    <Modal title={isActive ? 'License Active' : 'Get Premium'} onClose={onClose}>
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

            {/* Buy via Stripe */}
            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#635bff] to-[#00b4d8] text-white rounded-xl font-semibold shadow-lg hover:opacity-90 transition-opacity"
            >
              <ExternalLink size={18} /> Purchase on Stripe
            </a>

            <p className="text-xs text-center text-slate-400">
              After purchase you&apos;ll receive download links and instant access.
            </p>
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
