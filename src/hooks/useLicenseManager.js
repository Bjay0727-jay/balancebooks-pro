import { useEffect } from 'react';
import { useAppStore } from '../stores/useAppStore';

// Pro-gated features
const PRO_FEATURES = new Set([
  'dropbox-sync',
  'debt-planner',
  'analytics',
  'unlimited-transactions',
]);

const TX_LIMIT_FREE = 100;

export function useLicenseManager() {
  const licenseKey = useAppStore(s => s.licenseKey);
  const licenseStatus = useAppStore(s => s.licenseStatus);
  const licenseExpiry = useAppStore(s => s.licenseExpiry);
  const setLicenseStatus = useAppStore(s => s.setLicenseStatus);

  // Check expiry on mount
  useEffect(() => {
    if (!licenseKey) return;
    if (licenseExpiry && new Date(licenseExpiry) < new Date()) {
      setLicenseStatus('expired');
    }
  }, [licenseKey, licenseExpiry, setLicenseStatus]);

  const isActive = licenseStatus === 'active' && (!licenseExpiry || new Date(licenseExpiry) > new Date());

  const canUseFeature = (feature) => {
    if (!PRO_FEATURES.has(feature)) return true; // free feature
    return isActive;
  };

  return {
    isLicensed: isActive,
    licenseStatus,
    canUseFeature,
    TX_LIMIT_FREE,
  };
}
