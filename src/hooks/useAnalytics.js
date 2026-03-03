import { useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';

const ANALYTICS_ENDPOINT = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_ANALYTICS_ENDPOINT || '')
  : '';

export function useAnalytics() {
  const analyticsConsent = useAppStore(s => s.analyticsConsent);

  const trackEvent = useCallback((eventName, eventData = {}) => {
    if (analyticsConsent !== 'opted-in' || !ANALYTICS_ENDPOINT) return;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      appVersion: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'unknown',
      ...eventData,
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
    } else {
      fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {}); // silently fail
    }
  }, [analyticsConsent]);

  const trackPageView = useCallback((viewName) => {
    trackEvent('page_view', { view: viewName });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((feature) => {
    trackEvent('feature_used', { feature });
  }, [trackEvent]);

  return { trackEvent, trackPageView, trackFeatureUsage };
}
