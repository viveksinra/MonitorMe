import { useState, useEffect } from 'react';
import ConsentScreen from './components/ConsentScreen';
import MainScreen from './components/MainScreen';
import SettingsScreen from './components/SettingsScreen';
import ViewRequestDialog from './components/ViewRequestDialog';
import { MonitoringState, type ConsentData } from '@monitor-me/shared';

type Screen = 'main' | 'settings';

function App() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [viewRequest, setViewRequest] = useState<{ adminId: string; adminName: string } | null>(null);
  const [isLiveViewing, setIsLiveViewing] = useState(false);

  useEffect(() => {
    checkConsent();

    // Listen for view requests
    const unsubscribeViewRequest = window.electronAPI.onViewRequest((data) => {
      setViewRequest(data);
    });

    const unsubscribeViewCancelled = window.electronAPI.onViewCancelled(() => {
      setViewRequest(null);
      setIsLiveViewing(false);
    });

    const unsubscribeViewConnected = window.electronAPI.onViewConnected(() => {
      setViewRequest(null);
      setIsLiveViewing(true);
      // Update state to LIVE_VIEW_ACTIVE
      window.electronAPI.setState(MonitoringState.LIVE_VIEW_ACTIVE);
    });

    const unsubscribeViewEnded = window.electronAPI.onViewEnded(() => {
      setIsLiveViewing(false);
      // Revert to IDLE state
      window.electronAPI.setState(MonitoringState.IDLE);
    });

    const unsubscribeViewError = window.electronAPI.onViewError((data) => {
      console.error('View error:', data.message);
      alert(`Error: ${data.message}`);
      setViewRequest(null);
      setIsLiveViewing(false);
    });

    return () => {
      unsubscribeViewRequest();
      unsubscribeViewCancelled();
      unsubscribeViewConnected();
      unsubscribeViewEnded();
      unsubscribeViewError();
    };
  }, []);

  const checkConsent = async () => {
    try {
      const consent = await window.electronAPI.getConsent();
      setHasConsent(consent !== null);
    } catch (error) {
      console.error('Error checking consent:', error);
      setHasConsent(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsentComplete = async (consent: ConsentData) => {
    try {
      await window.electronAPI.setConsent(consent);
      setHasConsent(true);
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handleAcceptView = async () => {
    try {
      await window.electronAPI.acceptViewRequest();
    } catch (error) {
      console.error('Failed to accept view:', error);
      setViewRequest(null);
    }
  };

  const handleRejectView = () => {
    window.electronAPI.rejectViewRequest();
    setViewRequest(null);
  };

  const handleEndView = () => {
    window.electronAPI.endViewSession();
    setIsLiveViewing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const renderScreen = () => {
    if (!hasConsent) {
      return <ConsentScreen onConsentComplete={handleConsentComplete} />;
    }

    switch (currentScreen) {
      case 'settings':
        return <SettingsScreen onBack={() => setCurrentScreen('main')} />;
      case 'main':
      default:
        return <MainScreen onOpenSettings={() => setCurrentScreen('settings')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderScreen()}

      {viewRequest && (
        <ViewRequestDialog
          adminName={viewRequest.adminName}
          onAccept={handleAcceptView}
          onReject={handleRejectView}
        />
      )}

      {isLiveViewing && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-40">
          <p className="font-medium">Admin is viewing your screen</p>
          <button
            onClick={handleEndView}
            className="mt-2 w-full bg-white text-red-600 px-4 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            End Session
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
