import Modal from './Modal';
import { useAppStore } from '../stores/useAppStore';
import { BarChart3, Lock, Eye } from 'lucide-react';

export default function AnalyticsConsentModal({ onClose }) {
  const setAnalyticsConsent = useAppStore(s => s.setAnalyticsConsent);

  const handleOptIn = () => {
    setAnalyticsConsent('opted-in');
    onClose();
  };

  const handleOptOut = () => {
    setAnalyticsConsent('opted-out');
    onClose();
  };

  return (
    <Modal title="Help Us Improve" onClose={() => { setAnalyticsConsent('opted-out'); onClose(); }}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          We'd like to collect <strong>anonymous usage data</strong> to improve Balance Books Pro. No financial data is ever collected.
        </p>

        <div className="space-y-2.5">
          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <BarChart3 size={18} className="text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">What we collect</p>
              <p className="text-xs text-slate-500 mt-0.5">Feature usage counts and error rates only</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Lock size={18} className="text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">What we never collect</p>
              <p className="text-xs text-slate-500 mt-0.5">Transactions, balances, names, or any personal data</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Eye size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-900 text-sm">You're in control</p>
              <p className="text-xs text-slate-500 mt-0.5">Change anytime in Settings</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            onClick={handleOptOut}
            className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
          >
            No Thanks
          </button>
          <button
            onClick={handleOptIn}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700"
          >
            Help Improve
          </button>
        </div>
      </div>
    </Modal>
  );
}
