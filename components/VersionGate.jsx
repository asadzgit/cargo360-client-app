import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import { checkAppVersion } from '../services/versionCheck';
import UpdateRequiredScreen from './UpdateRequiredScreen';

/**
 * VersionGate component that checks app version before rendering children
 * Blocks app if update is required and forced
 */
export default function VersionGate({ children }) {
  const [versionCheck, setVersionCheck] = useState(null);
  const [checking, setChecking] = useState(true);

  const performVersionCheck = async () => {
    try {
      setChecking(true);
      const result = await checkAppVersion();
      setVersionCheck(result);
    } catch (error) {
      console.error('Version check error:', error);
      // Fail open - allow app to continue if check fails
      setVersionCheck(null);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Initial version check on mount
    performVersionCheck();

    // Listen for app state changes (app coming to foreground)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // Re-check version when app comes to foreground
        performVersionCheck();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  // Show loading state while checking
  if (checking) {
    return null; // Or a loading spinner if you prefer
  }

  // If version check failed or returned null, allow app to continue
  if (!versionCheck) {
    return children;
  }

  // If update is required (forced or not), show update screen
  if (versionCheck.updateRequired) {
    return (
      <UpdateRequiredScreen
        storeUrl={versionCheck.storeUrl}
        isForced={versionCheck.force}
      />
    );
  }

  // Version is OK, render children
  return children;
}


