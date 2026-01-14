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
# Development (with auto IP detection - RECOMMENDED)
yarn dev:auto         # Automatically detects your IP and starts Expo

# Development (with manual IP - update IP in package.json first)
yarn dev              # Start Expo with hardcoded IP from package.json

# Development (for iOS Simulator)
yarn dev:localhost    # Uses localhost (works for iOS Simulator)

# Development (for Android Emulator)
yarn dev:emulator     # Uses 10.0.2.2 (Android emulator special IP)

# Building
yarn build:web        # Build for web

# Linting
yarn lint             # Run Expo linter
```

### Which dev script should I use?

- **`yarn dev:auto`** (Recommended): Automatically detects your current IP address. Use this if you're testing on a physical device and your IP changes frequently.
- **`yarn dev:localhost`**: Use this if you're testing on iOS Simulator (localhost works directly).
- **`yarn dev:emulator`**: Use this if you're testing on Android Emulator (10.0.2.2 is the special IP that maps to host machine's localhost).
- **`yarn dev`**: Use this if you want to manually specify an IP address (update it in package.json first).

## Troubleshooting

### Network Error: Cannot Connect to Server

If you see a network error like:
```
❌ Network Error: Cannot connect to server at http://192.168.0.102:4000/
```

**This usually happens when:**
1. The backend server is not running
2. Your computer's IP address changed (common after network changes or pulling code)
3. Your device/emulator is on a different network than your computer

**Quick Fix (Recommended):**
Use the auto IP detection script - it automatically finds your current IP:
```bash
yarn dev:auto
```
This script will automatically detect your WiFi IP address and use it, so you don't need to update it manually every time it changes!

**Manual Fix (if auto-detection doesn't work):**

1. **Find your current IP address:**
   ```bash
   # Windows (PowerShell)
   ipconfig | findstr IPv4
   
   # Windows (CMD)
   ipconfig
   
   # Mac/Linux
   ifconfig | grep "inet "
   # or
   ip addr show
   ```
   Look for your local network IP (usually starts with `192.168.x.x` or `10.x.x.x`)

2. **Update the IP in `package.json`:**
   ```json
   "dev": "cross-env EXPO_NO_TELEMETRY=1 EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:4000/ expo start"
   ```
   Replace `YOUR_IP` with your current IP address (e.g., `192.168.0.105`)

3. **Make sure backend server is running:**
   - Navigate to the backend directory
   - Start the server (usually `npm start` or `node server.js`)
   - Verify it's running on port 4000

4. **Check network connectivity:**
   - Ensure your phone/emulator is on the same WiFi network as your computer
   - For Android emulator, use `10.0.2.2` instead of your local IP
   - For iOS simulator, `localhost` or `127.0.0.1` should work

5. **Restart Expo:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Clear cache and restart
   npx expo start --clear
   ```

**Alternative: Use Production API**
If you want to test against the production API instead of local:
- Remove or comment out `EXPO_PUBLIC_API_BASE_URL` from the dev script
- The app will use the production API: `https://cargo360-api.onrender.com/`

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
