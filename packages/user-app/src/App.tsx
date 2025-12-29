import { useState, useEffect } from 'react';
import ConsentScreen from './components/ConsentScreen';
import MainScreen from './components/MainScreen';
import SettingsScreen from './components/SettingsScreen';
import type { ConsentData } from '@monitor-me/shared';

type Screen = 'main' | 'settings';

function App() {
  const [hasConsent, setHasConsent] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  useEffect(() => {
    checkConsent();
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
    </div>
  );
}

export default App;
