/**
 * Google Places Autocomplete API Service
 * 
 * Provides location search with Pakistan restriction and Nominatim fallback
 * 
 * API Key: AIzaSyD3dYwbQlGyQlQWOOjY2u9RmyNYu-6rxWw
 * - Enabled APIs: Places API (New), Maps SDK for Android/iOS
 * - Restrictions: Pakistan only (country:pk)
 * - Type: geocode (addresses/locations only)
 * - Free tier: $200/month (~70k requests)
 * 
 * Fallback: OpenStreetMap Nominatim
 * - Used when Google Places fails or returns no results
 * - Also restricted to Pakistan (countrycodes=pk)
 */

const GOOGLE_PLACES_API_KEY = 'AIzaSyD3dYwbQlGyQlQWOOjY2u9RmyNYu-6rxWw';
const GOOGLE_PLACES_URL = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for locations using Google Places API with Nominatim fallback
 * 
 * @param {string} query - Search query (min 3 characters)
 * @returns {Promise<Array>} Array of location objects with {id, label, value, placeId?, lat?, lon?}
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    // Try Google Places API first
    const googleUrl = `${GOOGLE_PLACES_URL}?input=${encodeURIComponent(query)}&types=geocode&components=country:pk&key=${GOOGLE_PLACES_API_KEY}`;
    const googleResp = await fetch(googleUrl);
    const googleData = await googleResp.json();

    if (googleData.status === 'OK' && googleData.predictions && googleData.predictions.length > 0) {
      console.log('✅ Google Places API success');
      return googleData.predictions.map((item) => ({
        id: item.place_id,
        label: item.description,
        value: item.description,
        placeId: item.place_id,
        source: 'google',
      }));
    }

    console.log('⚠️ Google Places returned no results, using Nominatim fallback');
  } catch (googleError) {
    console.log('❌ Google Places error, using Nominatim fallback:', googleError.message);
  }

  // Fallback to Nominatim if Google fails or returns no results
  try {
    const nominatimUrl = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&countrycodes=pk&limit=10&addressdetails=1`;
    const resp = await fetch(nominatimUrl, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'Cargo360App/1.0 (contact: info@cargo360pk.com)',
        'Referer': 'https://cargo360pk.com',
      },
    });
    const data = await resp.json();
    console.log('✅ Nominatim fallback success');

    return (Array.isArray(data) ? data : []).map((item) => ({
      id: `${item.place_id}`,
      label: item.display_name,
      value: item.display_name,
      lat: item.lat,
      lon: item.lon,
      source: 'nominatim',
    }));
  } catch (nominatimError) {
    console.error('❌ Both Google Places and Nominatim failed:', nominatimError.message);
    return [];
  }
}

/**
 * Get place details by Place ID (Google Places only)
 * 
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object>} Place details with coordinates
 */
export async function getPlaceDetails(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    const resp = await fetch(url);
    const data = await resp.json();

    if (data.status === 'OK' && data.result) {
      return {
        lat: data.result.geometry.location.lat,
        lng: data.result.geometry.location.lng,
        address: data.result.formatted_address,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Failed to get place details:', error.message);
    return null;
  }
}

export default {
  searchLocations,
  getPlaceDetails,
  GOOGLE_PLACES_API_KEY,
};

