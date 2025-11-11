# Cargo360 Mobile App

Professional logistics and truck booking application built with React Native and Expo.

## Features

- 📦 Book trucks for cargo delivery
- 🗺️ **Google Places Autocomplete** for location search (Pakistan only)
- 📅 Date selection for pickup and delivery
- 🚚 Multiple vehicle types support
- 📊 View and manage bookings
- 👤 User profile management
- 🔐 Secure authentication

## Tech Stack

- **Framework**: React Native + Expo SDK 53
- **Router**: Expo Router v5
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Icons**: Lucide React Native
- **Maps**: Google Places API + OpenStreetMap Nominatim (fallback)

## Getting Started

### Prerequisites

- Node.js 20.19.4+
- Yarn or npm
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Start with cache cleared
npx expo start --clear
```

### Running on Devices

```bash
# Android
npx expo run:android

# iOS
npx expo run:ios

# Web
npx expo start --web
```

## Google Places API Integration

The app uses **Google Places Autocomplete API** for location search with the following configuration:

### API Configuration

- **API Key**: `AIzaSyD3dYwbQlGyQlQWOOjY2u9RmyNYu-6rxWw`
- **Enabled APIs**: Places API (New), Maps SDK
- **Restrictions**: Pakistan only (`country:pk`)
- **Type**: `geocode` (addresses/locations only)
- **Free Tier**: $200/month (~70,000 requests)

### Features

✅ **Min 3 characters** before search  
✅ **300ms debounce** to reduce API calls  
✅ **Pakistan restriction** (`country:pk`)  
✅ **Automatic fallback** to OpenStreetMap Nominatim  
✅ **Loading indicators** during search  
✅ **Error handling** with graceful degradation  

### Usage Example

```javascript
import { searchLocations } from '../services/googlePlaces';

// Search for locations
const results = await searchLocations('Lahore');
// Returns: [{ id, label, value, placeId, source: 'google' }]

// Fallback happens automatically if Google fails
// Returns: [{ id, label, value, lat, lon, source: 'nominatim' }]
```

### Implementation Details

1. **Primary**: Google Places Autocomplete API
   - Endpoint: `https://maps.googleapis.com/maps/api/place/autocomplete/json`
   - Parameters: `input`, `types=geocode`, `components=country:pk`, `key`

2. **Fallback**: OpenStreetMap Nominatim
   - Endpoint: `https://nominatim.openstreetmap.org/search`
   - Parameters: `format=json`, `q`, `countrycodes=pk`, `limit=10`

## Project Structure

```
cargo360-client-app/
├── app/                      # App screens and routes
│   ├── (tabs)/              # Tab navigation screens
│   │   ├── index.jsx        # Home screen
│   │   ├── book-truck.jsx   # Truck booking screen
│   │   ├── bookings.jsx     # My bookings screen
│   │   └── profile.jsx      # User profile screen
│   ├── _layout.jsx          # Root layout
│   ├── login.jsx            # Login screen
│   ├── signup.jsx           # Signup screen
│   ├── forgot-password.jsx  # Password reset
│   └── booking-detail.jsx   # Booking details
├── context/                  # React Context providers
│   └── BookingContext.jsx   # Booking & auth state
├── services/                 # API services
│   ├── api.js               # Backend API client
│   └── googlePlaces.js      # Google Places API service
├── assets/                   # Images and static files
├── app.json                 # Expo configuration
├── package.json             # Dependencies
└── README.md                # Documentation
```

## API Services

### Backend API (`services/api.js`)

```javascript
import { authAPI, bookingAPI } from '../services/api';

// Authentication
await authAPI.login(email, password);
await authAPI.signup({ name, email, company, phone, password });
await authAPI.me();

// Bookings
await bookingAPI.mine(status);
await bookingAPI.create(payload);
await bookingAPI.get(id);
```

### Google Places API (`services/googlePlaces.js`)

```javascript
import { searchLocations, getPlaceDetails } from '../services/googlePlaces';

// Search locations (with automatic fallback)
const locations = await searchLocations('Karachi');

// Get place details (coordinates)
const details = await getPlaceDetails(placeId);
```

## Environment Variables

The app uses the following configuration:

- **API Base URL**: `https://cargo360-api.onrender.com/`
- **Geoapify Key**: `43b48c16d2084b809197aaa6db21d937`
- **Google Places Key**: `AIzaSyD3dYwbQlGyQlQWOOjY2u9RmyNYu-6rxWw`

*(Defined in `app.json` under `extra` section)*

## Scripts

```bash
# Development
yarn dev              # Start Expo dev server

# Building
yarn build:web        # Build for web

# Linting
yarn lint             # Run Expo linter
```

## Known Issues

### Alert Import Issue (FIXED ✅)
**Issue**: "Property Alert does not exist" error after signup  
**Fix**: Removed Alert/router calls from BookingContext, handled in UI components instead  
**Files Changed**: `context/BookingContext.jsx`, `app/signup.jsx`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly on Android/iOS
4. Submit a pull request

## Support

For issues or questions, contact: info@cargo360pk.com

## License

Proprietary - Cargo360 © 2024
