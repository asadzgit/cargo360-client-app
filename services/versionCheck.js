import Constants from 'expo-constants';

// Get API base URL (same logic as in api.js)
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Constants?.expoConfig?.extra?.apiBaseUrl) ||
  'https://cargo360-api.onrender.com/';

/**
 * Gets the current app version from Expo Constants
 */
export function getAppVersion() {
  return Constants.expoConfig?.version || Constants.manifest?.version || '1.0.0';
}

/**
 * Gets the platform (android or ios)
 */
export function getPlatform() {
  return Constants.platform?.ios ? 'ios' : 'android';
}

/**
 * Checks if app version update is required
 * @returns {Promise<{updateRequired: boolean, force: boolean, storeUrl: string} | null>}
 */
export async function checkAppVersion() {
  try {
    const appVersion = getAppVersion();
    const platform = getPlatform();

    const response = await fetch(`${API_BASE_URL}mobile/app-version`, {
      method: 'GET',
      headers: {
        'Platform': platform,
        'App-Version': appVersion,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // If version check fails, allow app to continue (fail open)
      console.warn('Version check failed, allowing app to continue');
      return null;
    }

    const data = await response.json();
    return {
      updateRequired: data.updateRequired || false,
      force: data.force || false,
      storeUrl: data.storeUrl || '',
      minSupportedVersion: data.minSupportedVersion,
      latestVersion: data.latestVersion,
    };
  } catch (error) {
    console.error('Error checking app version:', error);
    // Fail open - allow app to continue if version check fails
    return null;
  }
}

