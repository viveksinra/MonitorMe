import { useState } from 'react';
import { CONSENT_VERSION } from '@monitor-me/shared';
import type { ConsentData } from '@monitor-me/shared';

interface ConsentScreenProps {
  onConsentComplete: (consent: ConsentData) => void;
}

export default function ConsentScreen({ onConsentComplete }: ConsentScreenProps) {
  const [screenshotConsent, setScreenshotConsent] = useState(false);
  const [liveViewConsent, setLiveViewConsent] = useState(false);
  const [visibilityAcknowledged, setVisibilityAcknowledged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allChecked = screenshotConsent && liveViewConsent && visibilityAcknowledged;

  const handleSubmit = async () => {
    if (!allChecked) return;

    setIsSubmitting(true);
    try {
      const consent: ConsentData = {
        screenshotConsent,
        liveViewConsent,
        visibilityAcknowledged,
        consentTimestamp: new Date().toISOString(),
        consentVersion: CONSENT_VERSION,
      };
      onConsentComplete(consent);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MonitorMe Setup</h1>
          <p className="text-gray-600 mt-2">
            Please review and consent to the monitoring features
          </p>
        </div>

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">What this app does:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>- Takes periodic screenshots during configured work hours</li>
            <li>- Allows authorized admins to view your screen live</li>
            <li>- Displays a visible indicator when monitoring is active</li>
            <li>- Lets you pause monitoring at any time</li>
          </ul>
        </div>

        {/* Consent Checkboxes */}
        <div className="space-y-4 mb-8">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={screenshotConsent}
              onChange={(e) => setScreenshotConsent(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-gray-900 group-hover:text-primary-600">
                I consent to periodic screenshots
              </span>
              <p className="text-sm text-gray-500">
                Screenshots will only be taken during your configured work hours
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={liveViewConsent}
              onChange={(e) => setLiveViewConsent(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-gray-900 group-hover:text-primary-600">
                I consent to admin-initiated live screen viewing
              </span>
              <p className="text-sm text-gray-500">
                You will always see a clear indicator when your screen is being viewed
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={visibilityAcknowledged}
              onChange={(e) => setVisibilityAcknowledged(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <div>
              <span className="font-medium text-gray-900 group-hover:text-primary-600">
                I understand monitoring indicators will be visible
              </span>
              <p className="text-sm text-gray-500">
                The tray icon will show the current monitoring status at all times
              </p>
            </div>
          </label>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!allChecked || isSubmitting}
          className="w-full btn-primary"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </span>
          ) : (
            'I Agree & Continue'
          )}
        </button>

        {/* Footer */}
        <p className="text-xs text-gray-400 text-center mt-6">
          You can update your preferences or pause monitoring at any time from the system tray
        </p>
      </div>
    </div>
  );
}
