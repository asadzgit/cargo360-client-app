import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, Linking, ActivityIndicator, RefreshControl, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Truck,
  Package,
  Calendar,
  User,
  ContainerIcon,
  ClipboardList,
  Phone,
  RefreshCcw,
  MapPin,
  X,
  Receipt,
  FileText,
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { bookingAPI } from '../services/api';
import Constants from 'expo-constants';
import { FontAwesome5 } from '@expo/vector-icons';
import { useEffect, useState, useCallback, useRef } from 'react';
import { humanize, formatCurrency, numberToWords } from '../utils';

const vehicleTypes = [
  'Small Truck (1-2 Tons)',
  'Medium Truck (3-5 Tons)', 
  'Large Truck (6-10 Tons)',
  'Heavy Truck (10+ Tons)'
];

export default function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();


  // added fetchBookings to keep list in context fresh if available
  const { bookings, getBookingById, updateBooking, cancelBooking, fetchBookings } = useBooking();
  const bookingFromContext = bookings.find(b => (b.id || b._id)?.toString() === bookingId);


  const [editError, setEditError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [customVehicleType, setCustomVehicleType] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryDateDisplay, setDeliveryDateDisplay] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const [form, setForm] = useState({
    pickupLocation: '',
    dropLocation: '',
    cargoType: '',
    vehicleType: '',
    description: '',
    cargoWeight: '',
    cargoSize: '',
    budget: '',
    salesTax: false,
    numContainers: '',
  });


  // Refresh state for pull-to-refresh and button
  const [refreshing, setRefreshing] = useState(false);


  // Driver location state (no modal anymore)
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [locData, setLocData] = useState(null); // { latitude, longitude, timestamp, speed, heading, accuracy, driver }
  const [locAddress, setLocAddress] = useState('');

  // Discount request state
  const [discountBudget, setDiscountBudget] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);

  // Confirmation state
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Location autocomplete state
  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropOptions, setDropOptions] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropLoading, setDropLoading] = useState(false);
  const pickupDebounceRef = useRef(null);
  const dropDebounceRef = useRef(null);

  // Modal animation values
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(50)).current;


  const [booking, setBooking] = useState(() => {
    if (!bookingFromContext) return null;
    return {
      id: bookingFromContext.id || bookingFromContext._id,
      vehicleType: bookingFromContext.vehicleType,
      loadType: bookingFromContext.cargoType || bookingFromContext.loadType,
      fromLocation: bookingFromContext.pickupLocation || bookingFromContext.fromLocation,
      toLocation: bookingFromContext.dropLocation || bookingFromContext.toLocation,
      createdAt: bookingFromContext.createdAt,
      status: bookingFromContext.status || 'Pending',
      description: bookingFromContext.description,
      cargoWeight: bookingFromContext.cargoWeight,
      // insurance: bookingFromContext.insurance,
      salesTax: bookingFromContext.salesTax,
      cargoSize: bookingFromContext.cargoSize,
      budget: bookingFromContext.budget,
      numContainers: bookingFromContext.numContainers || bookingFromContext.numberOfVehicles || '',
      deliveryDate: bookingFromContext.deliveryDate || bookingFromContext.delivery_date || '',
      pickupDate: bookingFromContext.pickupDate || bookingFromContext.pickup_date || bookingFromContext.createdAt || '',
      DiscountRequest: bookingFromContext.DiscountRequest || null,
    };
  });
  const [error, setError] = useState(null);


  useEffect(() => {
    let mounted = true;
    if (!bookingFromContext) {
      (async () => {
        try {
          const data = await getBookingById(bookingId);
          console.log("booking data", data)
          if (!mounted) return;
          const normalized = {
            id: data?.id || data?._id,
            vehicleType: data?.vehicleType,
            loadType: data?.cargoType || data?.loadType,
            fromLocation: data?.pickupLocation || data?.fromLocation,
            toLocation: data?.dropLocation || data?.toLocation,
            createdAt: data?.createdAt,
            status: data?.status || 'Pending',
            description: data?.description,
            cargoWeight: data?.cargoWeight,
            cargoSize: data?.cargoSize,
            budget: data?.budget,
            // insurance: data?.insurance || false,
            salesTax: data?.salesTax || false,
            numContainers: data?.numContainers || data?.numberOfVehicles || '',
            deliveryDate: data?.deliveryDate || data?.delivery_date || '',
            pickupDate: data?.pickupDate || data?.pickup_date || data?.createdAt || '',
            DiscountRequest: data?.DiscountRequest || null,

          };
          console.log(normalized);
          setBooking(normalized);
        } catch (e) {
          if (!mounted) return;
          setError(e?.message || 'Failed to load booking');
        }
      })();
    }
    return () => { mounted = false; };
  }, [bookingId]);


  useEffect(() => {
    console.log("booking", booking)
    if (booking) {
      const currentVehicleType = booking.vehicleType || '';
      // Check if the current vehicle type is in the predefined list
      const isPredefined = [...vehicleTypes, 'Other (please specify)'].includes(currentVehicleType);
      
      setForm({
        pickupLocation: booking.fromLocation || '',
        dropLocation: booking.toLocation || '',
        cargoType: booking.loadType || '',
        vehicleType: isPredefined ? currentVehicleType : (currentVehicleType ? 'Other (please specify)' : ''),
        description: booking.description || '',
        cargoWeight: booking.cargoWeight ? String(booking.cargoWeight) : '',
        salesTax: booking.salesTax || false,
        // insurance: booking.insurance || false,
        cargoSize: booking.cargoSize || '',
        budget: booking.budget ? String(booking.budget) : '',
        numContainers: booking.numContainers ? String(booking.numContainers) : '',
      });
      
      // Set delivery date
      const deliveryDateISO = booking.deliveryDate || booking.delivery_date || '';
      setDeliveryDate(deliveryDateISO);
      setDeliveryDateDisplay(formatISOToDisplay(deliveryDateISO));
      
      // Set pickup date (for validation)
      const pickupDateISO = booking.pickupDate || booking.pickup_date || booking.createdAt || '';
      setPickupDate(pickupDateISO);
      
      // Set custom vehicle type if it's not in the predefined list
      if (!isPredefined && currentVehicleType) {
        setCustomVehicleType(currentVehicleType);
      } else {
        setCustomVehicleType('');
      }
    }
  }, [booking]);

  // Modal animation effect
  useEffect(() => {
    if (editVisible) {
      // Animate in - slow and smooth
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(modalTranslateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out - slow and smooth
      Animated.parallel([
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalTranslateY, {
          toValue: 50,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [editVisible, modalOpacity, modalTranslateY]);


  // Auto-fetch driver location when booking status indicates driver is on route
  useEffect(() => {
    if (!booking) return;
    const status = (booking.status || '').toLowerCase();
    if (['picked_up', 'in_transit'].includes(status)) {
      // fetch immediately
      fetchDriverLocation();
    }
  }, [booking]);


  // ---------- ADDED: handleRefresh used by both pull-to-refresh and the button ----------
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      // Re-fetch single booking detail
      const data = await getBookingById(bookingId);
      const normalized = {
        id: data?.id || data?._id,
        vehicleType: data?.vehicleType,
        loadType: data?.cargoType || data?.loadType,
        fromLocation: data?.pickupLocation || data?.fromLocation,
        toLocation: data?.dropLocation || data?.toLocation,
        createdAt: data?.createdAt,
        status: data?.status || 'Pending',
        description: data?.description,
        cargoWeight: data?.cargoWeight,
            cargoSize: data?.cargoSize,
            budget: data?.budget,
            // insurance: data?.insurance || false,
            salesTax: data?.salesTax || false,
            numContainers: data?.numContainers || data?.numberOfVehicles || '',
            deliveryDate: data?.deliveryDate || data?.delivery_date || '',
            pickupDate: data?.pickupDate || data?.pickup_date || data?.createdAt || '',
            DiscountRequest: data?.DiscountRequest || null,

          };
      console.log(normalized);
      
      setBooking(normalized);
      setError(null);
      // Also refresh bookings list in context if available (keeps counts consistent)
      if (typeof fetchBookings === 'function') {
        try { await fetchBookings(undefined, { force: true }); } catch (_) {}
      }
    } catch (e) {
      console.error('Failed to refresh booking', e);
      setError(e?.message || 'Failed to refresh booking');
    } finally {
      setRefreshing(false);
    }
  }, [bookingId, getBookingById, fetchBookings]);
  // ---------- end ADDED ----------


  if (error || !booking) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>Booking Not Found</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || 'This booking could not be found.'}</Text>
        </View>
      </View>
    );
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      // Handle ISO format (YYYY-MM-DD)
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
      if (match) {
        const [, year, month, day] = match;
        const date = new Date(year, parseInt(month) - 1, day);
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
      // Fallback to standard date formatting
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };


  const handleCancelBooking = () => {
    const statusKey = (booking?.status || '').toLowerCase();
    if (['delivered', 'completed', 'cancelled'].includes(statusKey)) {
      Alert.alert('Not allowed', 'This booking cannot be cancelled.');
      return;
    }
    Alert.alert('Cancel booking?', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            await cancelBooking(booking.id);
            Alert.alert('Cancelled', 'Your booking has been cancelled.');
          } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to cancel booking.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };
 
  const handleSaveEdit = async () => {
    try {
      setUpdating(true);
      
      // Clear previous errors
      const errors = {};
      
      // Validate required fields
      const finalVehicleType = form.vehicleType === 'Other (please specify)' ? customVehicleType.trim() : form.vehicleType;
      if (!finalVehicleType) {
        errors.vehicleType = 'Vehicle type is required';
      }
      if (form.vehicleType === 'Other (please specify)' && finalVehicleType && finalVehicleType.length < 5) {
        errors.vehicleType = 'Please specify a vehicle type (min 5 characters)';
      }
      
      if (!form.cargoType) {
        errors.cargoType = 'Cargo type is required';
      }
      
      if (!form.cargoWeight) {
        errors.cargoWeight = 'Cargo weight is required';
      }
      
      if (!form.numContainers) {
        errors.numContainers = 'Number of containers/vehicles is required';
      }
      
      if (!form.pickupLocation) {
        errors.pickupLocation = 'Pickup location is required';
      }
      
      if (!form.dropLocation) {
        errors.dropLocation = 'Drop location is required';
      }
      
      if (!deliveryDate) {
        errors.deliveryDate = 'Delivery date is required';
      }
      
      // Date validation
      if (deliveryDate && pickupDate) {
        const pDate = new Date(pickupDate);
        const dDate = new Date(deliveryDate);
        if (dDate < pDate) {
          errors.deliveryDate = 'Delivery date cannot be before booking date';
        }
      }
      
      // Number of containers validation
      if (form.numContainers && Number(form.numContainers) > 100) {
        errors.numContainers = 'You cannot enter more than 100 containers/vehicles';
      }
      
      // If there are errors, set them and return
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        setUpdating(false);
        return;
      }
      
      // Clear errors if validation passes
      setValidationErrors({});
      
      // Prepare partials only for filled fields
      const payload = {};
      if (form.pickupLocation) payload.pickupLocation = form.pickupLocation;
      if (form.dropLocation) payload.dropLocation = form.dropLocation;
      if (form.cargoType) payload.cargoType = form.cargoType;
      
      // Handle vehicle type: use customVehicleType if "Other" is selected, otherwise use the selected type
      if (finalVehicleType) payload.vehicleType = finalVehicleType;
      if (form.description) payload.description = form.description;
      if (form.cargoWeight !== '') payload.cargoWeight = form.cargoWeight;
      if (form.cargoSize) payload.cargoSize = form.cargoSize;
      if (form.budget !== '') payload.budget = form.budget;
      if (form.numContainers) {
        payload.numContainers = form.numContainers;
        payload.numberOfVehicles = form.numContainers;
      }
      if (deliveryDate) payload.deliveryDate = deliveryDate;
      payload.salesTax = form.salesTax;
 
      // Update local booking state immediately (optimistic update)
      setBooking(prev => ({
        ...prev,
        vehicleType: form.vehicleType || prev.vehicleType,
        loadType: form.cargoType || prev.loadType,
        fromLocation: form.pickupLocation || prev.fromLocation,
        toLocation: form.dropLocation || prev.toLocation,
        description: form.description !== undefined ? form.description : prev.description,
        cargoWeight: form.cargoWeight || prev.cargoWeight,
        cargoSize: form.cargoSize || prev.cargoSize,
          budget: form.budget || prev.budget,
          numContainers: form.numContainers || prev.numContainers,
          deliveryDate: deliveryDate || prev.deliveryDate,
          salesTax: form.salesTax !== undefined ? form.salesTax : prev.salesTax,
        }));
      
      // Close modal first for better UX
      setEditVisible(false);
      setPickupOptions([]);
      setDropOptions([]);
      
      // Then update on server
      const updatedData = await updateBooking(booking.id, payload);
      
      // If server returns updated data, use it; otherwise keep the optimistic update
      if (updatedData) {
        const normalized = {
          id: updatedData?.id || updatedData?._id || booking.id,
          vehicleType: updatedData?.vehicleType || form.vehicleType || booking.vehicleType,
          loadType: updatedData?.cargoType || updatedData?.loadType || form.cargoType || booking.loadType,
          fromLocation: updatedData?.pickupLocation || updatedData?.fromLocation || form.pickupLocation || booking.fromLocation,
          toLocation: updatedData?.dropLocation || updatedData?.toLocation || form.dropLocation || booking.toLocation,
          createdAt: updatedData?.createdAt || booking.createdAt,
          status: updatedData?.status || booking.status,
          description: updatedData?.description !== undefined ? updatedData.description : form.description !== undefined ? form.description : booking.description,
          cargoWeight: updatedData?.cargoWeight || form.cargoWeight || booking.cargoWeight,
          cargoSize: updatedData?.cargoSize || form.cargoSize || booking.cargoSize,
          budget: updatedData?.budget || form.budget || booking.budget,
          numContainers: updatedData?.numContainers || updatedData?.numberOfVehicles || form.numContainers || booking.numContainers,
          deliveryDate: updatedData?.deliveryDate || updatedData?.delivery_date || deliveryDate || booking.deliveryDate,
          pickupDate: updatedData?.pickupDate || updatedData?.pickup_date || updatedData?.createdAt || booking.pickupDate || booking.createdAt,
          salesTax: updatedData?.salesTax !== undefined ? updatedData.salesTax : form.salesTax !== undefined ? form.salesTax : booking.salesTax,
          DiscountRequest: updatedData?.DiscountRequest || booking.DiscountRequest,
        };
        setBooking(normalized);
      }
      
      Alert.alert('Updated', 'Your booking has been updated.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to update booking.');
    } finally {
      setUpdating(false);
    }
  };

  // Handle discount request
  const handleRequestDiscount = async () => {
    const amount = parseFloat(discountBudget);
    
    // Validation
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid budget amount greater than 0.');
      return;
    }

    if (amount > 99999999) {
      Alert.alert('Invalid Amount', 'Amount is too large. Maximum is 99,999,999.');
      return;
    }

    try {
      setDiscountLoading(true);
      const response = await bookingAPI.createDiscountRequest(booking.id, amount);
      
      Alert.alert('Success', 'Discount request submitted successfully. We will review and get back to you.');
      setDiscountBudget('');
      
      // Refresh booking to get updated DiscountRequest
      await handleRefresh();
    } catch (error) {
      const errorMessage = error?.message || 'Failed to create discount request';
      if (errorMessage.includes('already exists')) {
        Alert.alert('Request Exists', 'You already have a discount request for this booking.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setDiscountLoading(false);
    }
  };

  // Handle order confirmation
  const handleConfirmOrder = () => {
    // Show confirmation dialog with terms
    Alert.alert(
      'Confirm Order',
      `You are about to confirm this shipment with the following details:\n\n` +
      `• Vehicle: ${humanize(booking.vehicleType)}\n` +
      `• Cargo: ${humanize(booking.loadType)}\n` +
      `• Route: ${booking.fromLocation} → ${booking.toLocation}\n` +
      `• Budget: PKR ${formatCurrency(booking.budget)}\n\n` +
      `By confirming, you agree to the terms and conditions of this shipment.\n\n` +
      `Do you want to proceed?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm Order',
          onPress: async () => {
            try {
              setConfirmLoading(true);
              const response = await bookingAPI.confirm(booking.id);
              
              // Update booking status locally
              setBooking(prev => ({
                ...prev,
                status: 'confirmed'
              }));

              // Refresh to get latest data
              await handleRefresh();

              // Show success message
              Alert.alert(
                'Order Confirmed! ✓',
                'Your shipment has been confirmed successfully. You will be notified shortly once a driver picks up your order.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              const errorMessage = error?.message || 'Failed to confirm order';
              Alert.alert('Error', errorMessage);
            } finally {
              setConfirmLoading(false);
            }
          },
        },
      ]
    );
  };


  // Build Google Maps directions URL pickup -> current (optional) -> drop
const buildGoogleMapsDirUrl = (pickup, current, drop) => {
  const p = encodeURIComponent(pickup || '');
  const d = encodeURIComponent(drop || '');
  if (current?.lat && current?.lng) {
    return `https://www.google.com/maps/dir/${p}/${current.lat},${current.lng}/${d}`;
  }
  return `https://www.google.com/maps/dir/${p}/${d}`;
};


const reverseGeocode = async (lat, lng) => {
  try {
    const key = Constants?.expoConfig?.extra?.geoapifyKey || Constants?.manifest?.extra?.geoapifyKey;
    if (!key) return null;
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&apiKey=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    const j = await r.json();
    return j?.features?.[0]?.properties?.formatted || null;
  } catch {
    return null;
  }
};


// Replace your existing fetchDriverLocation with this
const fetchDriverLocation = async () => {
  setLocLoading(true);
  setLocError('');
  setLocData(null);
  setLocAddress('');
  try {
    const resp = await bookingAPI.currentLocation(booking.id);
    // Axios response body or raw fetch fallback
    const body = resp?.data ?? resp;
    // Unwrap { success, data: {...} } if present
    const container = body?.data ?? body;
    // Prefer container.currentLocation, else container (for safety)
    const current = container?.currentLocation ?? container;


    const lat = current?.latitude;
    const lng = current?.longitude;


    if (typeof lat === 'number' && typeof lng === 'number') {
      const addr = await reverseGeocode(lat, lng);
      setLocAddress(addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setLocData(current);
    } else {
      const msg = container?.message || body?.message || 'The driver has not shared their location yet.';
      setLocError(msg);
    }
  } catch (e) {
    setLocError(e?.message || 'Failed to fetch driver location');
  } finally {
    setLocLoading(false);
  }
};


const openMaps = () => {
  const url = buildGoogleMapsDirUrl(
    booking.fromLocation,
    locData?.latitude && locData?.longitude ? { lat: locData.latitude, lng: locData.longitude } : null,
    booking.toLocation
  );
  Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open Google Maps.'));
};

// Location autocomplete functions (same as book-truck.jsx)
const fetchLocations = async (query, setOpts, setLoad) => {
  if (!query || query.trim().length < 3) {
    setOpts([]);
    return;
  }
  setLoad(true);
  
  try {
    // Try Google Places API first
    const googleUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=geocode&components=country:pk&key=AIzaSyD3dYwbQlGyQlQWOOjY2u9RmyNYu-6rxWw`;
    const googleResp = await fetch(googleUrl);
    const googleData = await googleResp.json();
    
    if (googleData.status === 'OK' && googleData.predictions && googleData.predictions.length > 0) {
      const opts = googleData.predictions.map((item) => ({
        id: item.place_id,
        label: item.description,
        value: item.description,
        placeId: item.place_id,
      }));
      setOpts(opts);
      setLoad(false);
      return;
    }
    
    console.log("Google Places failed or no results, falling back to Nominatim");
  } catch (googleError) {
    console.log("Google Places error, falling back to Nominatim:", googleError);
  }
  
  // Fallback to Nominatim if Google fails or returns no results
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pk&limit=10&addressdetails=1`;
    const resp = await fetch(
      url, 
      { headers: 
        { 'Accept-Language': 'en', 
          'User-Agent': 'Cargo360App/1.0 (contact: info@cargo360pk.com)',
          'Referer': 'https://cargo360pk.com'
        }
      }
    );
    const data = await resp.json();
    const opts = (Array.isArray(data) ? data : []).map((item) => ({
      id: `${item.place_id}`,
      label: item.display_name,
      value: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
    setOpts(opts);
  } catch (_e) {
    setOpts([]);
    console.log("Nominatim error:", _e);
  } finally {
    setLoad(false);
  }
};

const handlePickupLocationChange = (text) => {
  setForm((s) => ({ ...s, pickupLocation: text }));
  // Clear error when user types
  if (validationErrors.pickupLocation) {
    setValidationErrors(prev => ({ ...prev, pickupLocation: '' }));
  }
  if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
  pickupDebounceRef.current = setTimeout(() => {
    fetchLocations(text, setPickupOptions, setPickupLoading);
  }, 300);
};

const handleDropLocationChange = (text) => {
  setForm((s) => ({ ...s, dropLocation: text }));
  // Clear error when user types
  if (validationErrors.dropLocation) {
    setValidationErrors(prev => ({ ...prev, dropLocation: '' }));
  }
  if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
  dropDebounceRef.current = setTimeout(() => {
    fetchLocations(text, setDropOptions, setDropLoading);
  }, 300);
};


  // Date formatting functions (from book-truck.jsx)
  const formatDateInput = (value) => {
    const digits = value.replace(/[^\d/]/g, "");
    
    if (digits.length < value.length) {
      return digits;
    }

    const numbers = digits.replace(/\D/g, "");
    
    if (numbers.length === 1) {
      return numbers;
    }
    
    const limited = numbers.slice(0, 8);
    
    let day = limited.slice(0, 2);
    let month = limited.slice(2, 4);
    let year = limited.slice(4, 8);

    if (day.length === 2 && parseInt(day) > 31) day = "31";
    if (day.length === 2 && parseInt(day) < 1) day = "01";

    if (month.length === 2 && parseInt(month) > 12) month = "12";
    if (month.length === 2 && parseInt(month) < 1) month = "01";

    const currentYear = new Date().getFullYear();
    const minYear = currentYear;
    const maxYear = currentYear + 2;

    if (year && year.length === 4) {
      const parsedYear = parseInt(year);
      
      if (parsedYear < minYear || parsedYear > maxYear) {
        year = String(currentYear);
      }
    }

    let formatted = day;
    
    if (day.length === 2) {
      formatted += "/";
      
      if (month) {
        formatted += month;
      }
      
      if (month.length === 2) {
        formatted += "/";
        
        if (year) {
          formatted += year;
        }
      }
    }

    return formatted;
  };

  const validateAndConvertDate = (formatted, setDateFunction) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
    if (match) {
      const [, day, month, year] = match;
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);

      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        setDateFunction(iso);
        return;
      }
    }
    setDateFunction("");
  };

  const convertFormattedToISO = (formatted) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(formatted);
    if (!match) return null;

    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  };

  const formatISOToDisplay = (isoDate) => {
    if (!isoDate) return '';
    try {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      return isoDate;
    } catch {
      return isoDate;
    }
  };

  const handleDeliveryDateChange = (text) => {
    const formatted = formatDateInput(text);
    setDeliveryDateDisplay(formatted);

    // Convert to ISO (or empty)
    validateAndConvertDate(formatted, setDeliveryDate);

    // Clear error when user types
    if (validationErrors.deliveryDate) {
      setValidationErrors(prev => ({ ...prev, deliveryDate: '' }));
    }

    // Live validation: delivery must not be less than pickup
    const deliveryISO = convertFormattedToISO(formatted);
    if (deliveryISO && pickupDate) {
      const pDate = new Date(pickupDate);
      const dDate = new Date(deliveryISO);

      if (dDate < pDate) {
        setValidationErrors(prev => ({ ...prev, deliveryDate: 'Delivery date cannot be before booking date' }));
      } else {
        setValidationErrors(prev => ({ ...prev, deliveryDate: '' }));
      }
    }
  };

  // Handle modal close with cleanup
  const handleCloseModal = () => {
    setEditVisible(false);
    setPickupOptions([]);
    setDropOptions([]);
    setValidationErrors({}); // Clear validation errors when closing modal
    // Clear any pending debounce timeouts
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
  };

  return (
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#01304e']}
          tintColor="#01304e"
        />
      }
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ClipboardList size={32} color="#FFFFFF" style={{alignSelf: 'center'}} />
        <Text style={styles.title}>Booking Details</Text>
      </View>


      {/* Buttons row - Edit on left, Refresh on right */}
      <View style={styles.buttonsContainer}>
        {/* Edit Button - Available for editable statuses */}
        {!['delivered', 'completed', 'cancelled'].includes((booking.status || '').toLowerCase()) && (
          <TouchableOpacity
            onPress={() => setEditVisible(true)}
            disabled={updating}
            style={[styles.editButton, updating && styles.editButtonDisabled]}
          >
            <Text style={styles.editButtonText}>
              {updating ? 'Updating...' : 'Edit Booking'}
            </Text>
          </TouchableOpacity>
        )}
        
        {/* Refresh button */}
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <RefreshCcw size={16} color="#FFFFFF" />
              <Text style={styles.refreshText}>Refresh</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.statusSection}>
          <Text style={styles.bookingId}>Booking id: C360-PK-{booking.id}</Text>
          <View style={[
            styles.statusBadge,
            booking.status === 'Accepted' ? styles.statusAccepted :
            booking.status === 'Completed' ? styles.statusCompleted :
            styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              booking.status === 'Accepted' ? styles.statusTextAccepted :
              booking.status === 'Completed' ? styles.statusTextCompleted :
              styles.statusTextPending
            ]}>
              {booking.status}
            </Text>
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Vehicle & Load Information</Text>
         
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Truck size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle Type</Text>
              <Text style={styles.detailValue}>{humanize(booking.vehicleType)}</Text>
            </View>
          </View>


          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Package size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Cargo Type</Text>
              <Text style={styles.detailValue}>{humanize(booking.loadType)}</Text>
            </View>
          </View>


          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <ContainerIcon size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Cargo Weight (kg)</Text>
              <Text style={styles.detailValue}>{booking.cargoWeight || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Truck size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>No. of Containers/Vehicles</Text>
              <Text style={styles.detailValue}>{booking.numContainers || booking.numberOfVehicles || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <FileText size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sales Tax Invoice</Text>
              <Text style={styles.detailValue}>{booking?.salesTax ? 'Yes' : 'No'}</Text>
            </View>
          </View>


          {booking.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.detailLabel}>Additional Details</Text>
              <Text style={styles.descriptionText}>{booking.description}</Text>
            </View>
          )}
        </View>


        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Route Information</Text>
         
          <View style={styles.routeContainer}>
            <View style={styles.routePoint}>
              <View style={styles.routeIconContainer}>
                <MapPin size={18} color="#1B873E" />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup Location</Text>
                <Text style={styles.routeAddress}>{booking.fromLocation}</Text>
              </View>
            </View>


            <View style={styles.routeConnector} />


            <View style={styles.routePoint}>
              <View style={styles.routeIconContainer}>
                <MapPin size={18} color="#DC2626" />
              </View>
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Delivery Location</Text>
                <Text style={styles.routeAddress}>{booking.toLocation}</Text>
              </View>
            </View>
          </View>
        </View>


        <View style={styles.detailsCard}>
          <Text style={styles.cardTitle}>Booking Information</Text>
         
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Calendar size={20} color="#01304e" />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Requested On</Text>
              <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
            </View>
          </View>

          {booking.deliveryDate && (
            <View style={styles.detailRow}>
              <View style={styles.iconContainer}>
                <Calendar size={20} color="#01304e" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Delivery Date</Text>
                <Text style={styles.detailValue}>{formatDateOnly(booking.deliveryDate)}</Text>
              </View>
            </View>
          )}
        </View>


        {/* Pricing & Budget Section */}
        <View style={styles.pricingCard}>
          <Text style={styles.cardTitle}>Pricing</Text>

          {/* No Budget Set */}
          {!booking.budget && (
            <Text style={styles.negotiationText}>In Negotiation</Text>
          )}

          {/* Budget Exists */}
          {booking.budget && (
            <>
              {/* Discount Request Status Messages */}
              {booking.DiscountRequest?.status === 'pending' && (
                <View style={styles.statusMessageContainer}>
                  <Text style={styles.statusPendingText}>Discount request pending</Text>
                  <Text style={styles.statusSubtext}>
                    Your request for PKR {formatCurrency(booking.DiscountRequest.requestAmount)} is under review
                  </Text>
                </View>
              )}

              {booking.DiscountRequest?.status === 'accepted' && (
                <View style={styles.statusMessageContainer}>
                  <Text style={styles.statusAcceptedText}>✓ Discount request accepted</Text>
                  <Text style={styles.statusAcceptedText}>
                    Amount accepted: PKR {formatCurrency(booking.DiscountRequest.requestAmount)}
                  </Text>
                </View>
              )}

              {booking.DiscountRequest?.status === 'rejected' && (
                <View style={styles.statusMessageContainer}>
                  <Text style={styles.statusRejectedText}>✗ Discount request rejected</Text>
                  <Text style={styles.statusRejectedText}>
                    Amount rejected: PKR {formatCurrency(booking.DiscountRequest.requestAmount)}
                  </Text>
                </View>
              )}

              {/* Show Discount Request Form (only if no discount request or rejected) */}
              {(!booking.DiscountRequest || booking.DiscountRequest.status === 'rejected') && (
                <View style={styles.discountForm}>
                  <Text style={styles.discountLabel}>
                    Want a discount?{'\n'}Enter your budget (PKR)
                  </Text>
                  <TextInput
                    style={styles.discountInput}
                    placeholder="Your budget amount"
                    placeholderTextColor="#999999"
                    keyboardType="numeric"
                    value={discountBudget}
                    onChangeText={setDiscountBudget}
                    maxLength={8}
                    editable={!discountLoading}
                  />
                  <TouchableOpacity
                    style={[styles.discountButton, discountLoading && styles.discountButtonDisabled]}
                    onPress={handleRequestDiscount}
                    disabled={discountLoading}
                  >
                    <Text style={styles.discountButtonText}>
                      {discountLoading ? 'Submitting...' : 'Request discount'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Budget Display */}
              <Text style={styles.budgetDescription}>
                Best price after discussion with several brokers
              </Text>
              
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Budget</Text>
                <Text style={styles.budgetAmount}>
                  PKR {formatCurrency(booking.budget)}
                </Text>
              </View>

              {/* Amount in Words */}
              <View style={styles.wordsContainer}>
                <Text style={styles.wordsLabel}>Amount in words</Text>
                <Text style={styles.wordsValue}>
                  {numberToWords(booking.budget)}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Confirmation Button - Only show if budget exists and status is pending or assigned */}
        {booking.budget && ['pending', 'assigned'].includes((booking.status || '').toLowerCase()) && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmationTitle}>Ready to proceed?</Text>
            <Text style={styles.confirmationText}>
              By confirming this order, you agree to the shipment details, pricing, and terms & conditions. 
              Once confirmed, a driver will be assigned to your shipment.
            </Text>
            
            <TouchableOpacity
              style={[styles.confirmButton, confirmLoading && styles.confirmButtonDisabled]}
              onPress={handleConfirmOrder}
              disabled={confirmLoading}
            >
              {confirmLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.confirmButtonText}>✓ Confirm Order & Agree to Terms</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.confirmationNote}>
              You will be notified once a driver accepts your shipment
            </Text>
          </View>
        )}


        {booking.status === 'Accepted' && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Driver Information</Text>
           
            <View style={styles.driverInfo}>
              <View style={styles.driverAvatar}>
                <User size={24} color="#FFFFFF" />
              </View>
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>Mike Johnson</Text>
                <Text style={styles.driverRating}>⭐ 4.8 (127 reviews)</Text>
                <Text style={styles.driverVehicle}>Truck License: ABC-1234</Text>
              </View>
            </View>


            <TouchableOpacity style={styles.contactButton}>
              <Phone size={20} color="#FFFFFF" />
              <Text style={styles.contactButtonText}>Contact Driver</Text>
            </TouchableOpacity>
          </View>
        )}

        {booking.status === 'Pending' && (
          <>
            <View style={styles.pendingInfo}>
              <Text style={styles.pendingTitle}>Looking for a driver...</Text>
              <Text style={styles.pendingText}>
                We're searching for available drivers in your area. You'll be notified once a driver accepts your request.
              </Text>
            </View>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancelBooking}
                disabled={cancelling}
                style={{ backgroundColor: '#DC2626', opacity: cancelling ? 0.6 : 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Replaced button with live Driver Location card (Option C, card style) */}
        {['picked_up', 'in_transit'].includes(booking.status.toLowerCase()) && (
          <View style={styles.detailsCard}>
            <Text style={styles.cardTitle}>Driver Location</Text>

            {locLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator color="#2563EB" />
                <Text style={{ color: '#64748B', marginTop: 8 }}>Fetching current location…</Text>
              </View>
            ) : locError ? (
              <Text style={{ color: '#DC2626', marginBottom: 8 }}>{locError}</Text>
            ) : locData ? (
              <>
                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <MapPin size={18} color="#01304e" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Address</Text>
                    <Text style={styles.detailValue}>{locAddress || `${locData.latitude}, ${locData.longitude}`}</Text>
                  </View>
                </View>

                {locData?.driver?.name || locData?.driver?.phone ? (
                  <View style={styles.detailRow}>
                    <View style={styles.iconContainer}>
                      <User size={18} color="#01304e" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>Driver</Text>
                      <Text style={styles.detailValue}>
                        {locData?.driver?.name || 'N/A'}{locData?.driver?.phone ? ` · ${locData.driver.phone}` : ''}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <View style={styles.iconContainer}>
                    <ClipboardList size={18} color="#01304e" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Last updated</Text>
                    <Text style={styles.detailValue}>{locData?.timestamp ? new Date(locData.timestamp).toLocaleString() : 'N/A'}</Text>
                  </View>
                </View>

                {typeof locData?.speed === 'number' && (
                  <Text style={{ color: '#64748B' }}>Speed: {locData.speed} km/h</Text>
                )}
                {typeof locData?.heading === 'number' && (
                  <Text style={{ color: '#64748B' }}>Heading: {locData.heading}°</Text>
                )}
                {typeof locData?.accuracy === 'number' && (
                  <Text style={{ color: '#64748B' }}>Accuracy: {locData.accuracy} m</Text>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0EA5E9' }]} onPress={fetchDriverLocation}>
                    <Text style={styles.modalButtonText}>Refresh Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.mapButton]} onPress={openMaps}>
                    <Text style={styles.mapButtonText}>Open in Google Maps</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <Text style={styles.detailValue}>Driver location not available.</Text>
            )}
          </View>
        )}
      </View>
      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="none" onRequestClose={handleCloseModal}>
        <Animated.View 
          style={[
            styles.modalBackdrop,
            {
              opacity: modalOpacity,
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalCard,
              {
                transform: [{ translateY: modalTranslateY }],
              }
            ]}
          >
            <LinearGradient
              colors={['#01304e', '#ed8411']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalHeader}
            >
              <View style={styles.modalHeaderContent}>
                <FontAwesome5 name="truck" size={20} color="#FFFFFF" solid style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Edit Booking</Text>
              </View>
            </LinearGradient>
            
            <ScrollView style={styles.modalScrollView} contentContainerStyle={{ paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {/* Delivery Date */}
              <Text style={styles.modalLabel}>Delivery Date *</Text>
              <TextInput
                style={[styles.modalInput, validationErrors.deliveryDate && styles.modalInputError]}
                value={deliveryDateDisplay}
                onChangeText={handleDeliveryDateChange}
                keyboardType="numeric"
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
              />
              {validationErrors.deliveryDate && (
                <Text style={styles.modalErrorText}>{validationErrors.deliveryDate}</Text>
              )}

              {/* Vehicle Type */}
              <Text style={styles.modalLabel}>Vehicle Type *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalOptionsContainer}>
                {[...vehicleTypes, 'Other (please specify)'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.modalOptionButton,
                      form.vehicleType === type && styles.modalOptionButtonSelected
                    ]}
                    onPress={() => {
                      setForm((s) => ({ ...s, vehicleType: type }));
                      if (type !== 'Other (please specify)') setCustomVehicleType('');
                      // Clear error when user selects
                      if (validationErrors.vehicleType) {
                        setValidationErrors(prev => ({ ...prev, vehicleType: '' }));
                      }
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      form.vehicleType === type && styles.modalOptionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {form.vehicleType === 'Other (please specify)' && (
                <View style={{ marginTop: 8 }}>
                  <TextInput 
                    style={[styles.modalInput, validationErrors.vehicleType && styles.modalInputError]} 
                    placeholder="Other vehicle type (min 5 characters)" 
                    value={customVehicleType} 
                    onChangeText={(t) => {
                      setCustomVehicleType(t);
                      // Clear error when user types
                      if (validationErrors.vehicleType) {
                        setValidationErrors(prev => ({ ...prev, vehicleType: '' }));
                      }
                    }}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}
              {validationErrors.vehicleType && (
                <Text style={styles.modalErrorText}>{validationErrors.vehicleType}</Text>
              )}

              {/* Cargo Type */}
              <Text style={styles.modalLabel}>Cargo Type *</Text>
              <TextInput 
                style={[styles.modalInput, validationErrors.cargoType && styles.modalInputError]} 
                placeholder="Cargo Type" 
                value={form.cargoType} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, cargoType: t }));
                  // Clear error when user types
                  if (validationErrors.cargoType) {
                    setValidationErrors(prev => ({ ...prev, cargoType: '' }));
                  }
                }} 
              />
              {validationErrors.cargoType && (
                <Text style={styles.modalErrorText}>{validationErrors.cargoType}</Text>
              )}

              {/* Cargo Weight */}
              <Text style={styles.modalLabel}>Cargo Weight (kg) *</Text>
              <TextInput 
                style={[styles.modalInput, validationErrors.cargoWeight && styles.modalInputError]} 
                placeholder="Cargo Weight in kg" 
                keyboardType="numeric" 
                value={form.cargoWeight} 
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, cargoWeight: t }));
                  // Clear error when user types
                  if (validationErrors.cargoWeight) {
                    setValidationErrors(prev => ({ ...prev, cargoWeight: '' }));
                  }
                }} 
              />
              {validationErrors.cargoWeight && (
                <Text style={styles.modalErrorText}>{validationErrors.cargoWeight}</Text>
              )}

              {/* No. of Containers/Vehicles */}
              <Text style={styles.modalLabel}>No. of Containers/Vehicles *</Text>
              <TextInput 
                style={[styles.modalInput, (validationErrors.numContainers || (form.numContainers !== '' && Number(form.numContainers) > 100)) && styles.modalInputError]} 
                placeholder="numbers of containers/vehicles" 
                keyboardType="numeric" 
                value={form.numContainers} 
                onChangeText={(t) => {
                  // Allow only digits
                  const cleaned = t.replace(/[^0-9]/g, '');
                  setForm((s) => ({ ...s, numContainers: cleaned }));
                  // Clear error when user types
                  if (validationErrors.numContainers) {
                    setValidationErrors(prev => ({ ...prev, numContainers: '' }));
                  }
                }}
                placeholderTextColor="#94A3B8"
              />
              {(validationErrors.numContainers || (form.numContainers !== '' && Number(form.numContainers) > 100)) && (
                <Text style={styles.modalErrorText}>
                  {validationErrors.numContainers || 'You cannot enter more than 100 containers/vehicles.'}
                </Text>
              )}

              {/* Sales Tax Invoice */}
              <Text style={styles.modalLabel}>Sales Tax Invoice</Text>
              <Pressable
                onPress={() => setForm((s) => ({ ...s, salesTax: !s.salesTax }))}
                style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderWidth: 2,
                    borderColor: '#64748B',
                    borderRadius: 4,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: form.salesTax ? '#01304e' : 'transparent',
                  }}
                >
                  {form.salesTax && <Text style={{ color: 'white', fontWeight: 'bold' }}>✓</Text>}
                </View>
                <Text style={{ marginLeft: 8, color: '#334155', fontSize: 15 }}>
                  Sales Tax Invoice
                </Text>
              </Pressable>

              {/* Additional Details */}
              <Text style={styles.modalLabel}>Additional Details</Text>
              <TextInput 
                style={[styles.modalInput, { height: 80 }]} 
                placeholder="Describe your cargo in detail..." 
                multiline 
                value={form.description} 
                onChangeText={(t) => setForm((s) => ({ ...s, description: t }))} 
                textAlignVertical="top"
              />

              {/* Route Information */}
              <Text style={styles.modalLabel}>Route Information</Text>
              
              {/* Pickup Location with Autocomplete */}
              <Text style={styles.modalSubLabel}>Pickup Location *</Text>
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <View style={[styles.modalInputContainer, validationErrors.pickupLocation && { borderColor: '#DC2626' }]}>
                  <MapPin size={16} color="#64748B" style={{ marginRight: 8, marginTop: 2 }} />
                  <TextInput 
                    style={[styles.modalInput, { borderWidth: 0, padding: 0, flex: 1 }]} 
                    placeholder="Search for pickup location..." 
                    value={form.pickupLocation} 
                    onChangeText={handlePickupLocationChange}
                    placeholderTextColor="#94A3B8"
                  />
                  {form.pickupLocation.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setForm((s) => ({ ...s, pickupLocation: '' }));
                        setPickupOptions([]);
                        if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
                        // Clear error when cleared
                        if (validationErrors.pickupLocation) {
                          setValidationErrors(prev => ({ ...prev, pickupLocation: '' }));
                        }
                      }}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
                {(pickupLoading || pickupOptions.length > 0) && (
                  <View style={styles.modalDropdown}>
                    {pickupLoading ? (
                      <Text style={styles.modalDropdownHint}>Searching locations...</Text>
                    ) : (
                      <ScrollView style={styles.modalDropdownScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {pickupOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.id}
                            style={styles.modalDropdownItem}
                            onPress={() => {
                              setForm((s) => ({ ...s, pickupLocation: opt.value }));
                              setPickupOptions([]);
                              // Clear error when location is selected
                              if (validationErrors.pickupLocation) {
                                setValidationErrors(prev => ({ ...prev, pickupLocation: '' }));
                              }
                            }}
                          >
                            <Text style={styles.modalDropdownText}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    {!pickupLoading && pickupOptions.length === 0
                      && form.pickupLocation.trim().length > 0 && form.pickupLocation.trim().length < 3 && (
                      <Text style={styles.modalDropdownHint}>Type at least 3 characters to search...</Text>
                    )}
                  </View>
                )}
                {validationErrors.pickupLocation && (
                  <Text style={[styles.modalErrorText, { marginTop: 4, marginBottom: 8 }]}>{validationErrors.pickupLocation}</Text>
                )}
              </View>
              
              {/* Drop Location with Autocomplete */}
              <Text style={styles.modalSubLabel}>Drop Off Location *</Text>
              <View style={{ position: 'relative', marginBottom: 12 }}>
                <View style={[styles.modalInputContainer, validationErrors.dropLocation && { borderColor: '#DC2626' }]}>
                  <MapPin size={16} color="#64748B" style={{ marginRight: 8, marginTop: 2 }} />
                  <TextInput 
                    style={[styles.modalInput, { borderWidth: 0, padding: 0, flex: 1 }]} 
                    placeholder="Search for delivery location..." 
                    value={form.dropLocation} 
                    onChangeText={handleDropLocationChange}
                    placeholderTextColor="#94A3B8"
                  />
                  {form.dropLocation.length > 0 && (
                    <TouchableOpacity
                      onPress={() => {
                        setForm((s) => ({ ...s, dropLocation: '' }));
                        setDropOptions([]);
                        if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
                        // Clear error when cleared
                        if (validationErrors.dropLocation) {
                          setValidationErrors(prev => ({ ...prev, dropLocation: '' }));
                        }
                      }}
                      style={{ padding: 4 }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <X size={18} color="#64748B" />
                    </TouchableOpacity>
                  )}
                </View>
                {(dropLoading || dropOptions.length > 0) && (
                  <View style={styles.modalDropdown}>
                    {dropLoading ? (
                      <Text style={styles.modalDropdownHint}>Searching locations...</Text>
                    ) : (
                      <ScrollView style={styles.modalDropdownScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                        {dropOptions.map((opt) => (
                          <TouchableOpacity
                            key={opt.id}
                            style={styles.modalDropdownItem}
                            onPress={() => {
                              setForm((s) => ({ ...s, dropLocation: opt.value }));
                              setDropOptions([]);
                              // Clear error when location is selected
                              if (validationErrors.dropLocation) {
                                setValidationErrors(prev => ({ ...prev, dropLocation: '' }));
                              }
                            }}
                          >
                            <Text style={styles.modalDropdownText}>{opt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                    {!dropLoading && dropOptions.length === 0
                      && form.dropLocation.trim().length > 0 && form.dropLocation.trim().length < 3 && (
                      <Text style={styles.modalDropdownHint}>Type at least 3 characters to search...</Text>
                    )}
                  </View>
                )}
                {validationErrors.dropLocation && (
                  <Text style={[styles.modalErrorText, { marginTop: 4, marginBottom: 8 }]}>{validationErrors.dropLocation}</Text>
                )}
              </View>
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, paddingHorizontal: 16, paddingBottom: 16 }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#64748B' }]} onPress={handleCloseModal}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2563EB' }]} onPress={handleSaveEdit} disabled={updating}>
                <Text style={styles.modalButtonText}>{updating ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 24,
    backgroundColor: '#01304e',
    color: '#FFFFFF',
    gap: 16,
    marginBottom: 24,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    height: 180,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  bookingId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#01304e',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusAccepted: {
    backgroundColor: '#E6F9ED',
  },
  statusCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusPending: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextAccepted: {
    color: '#1B873E',
  },
  statusTextCompleted: {
    color: '#01304e',
  },
  statusTextPending: {
    color: '#ED8411',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#01304e',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailContent: {
    flex: 1,
    paddingTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 15,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 21,
  },
  descriptionSection: {
    marginTop: 4,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  descriptionText: {
    fontSize: 14,
    color: '#777777',
    lineHeight: 22,
    marginTop: 6,
  },
  routeContainer: {
    paddingVertical: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  routeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F0F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  routeDotStart: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
    marginTop: 4,
  },
  routeDotEnd: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    marginTop: 4,
  },
  routeConnector: {
    width: 3,
    height: 28,
    backgroundColor: '#E2E8F0',
    marginLeft: 18,
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
    paddingTop: 2,
  },
  routeLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  routeAddress: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    lineHeight: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#01304e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#01304e',
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 12,
    color: '#777777',
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: '#999999',
  },
  contactButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pendingInfo: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#ED8411',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ED8411',
    marginBottom: 8,
  },
  pendingText: {
    fontSize: 14,
    color: '#92400E',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  modalInputError: {
    borderColor: '#DC2626',
  },
  modalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  modalDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#01304e',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    maxHeight: 200,
  },
  modalDropdownScroll: {
    maxHeight: 200,
  },
  modalDropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalDropdownText: {
    fontSize: 14,
    color: '#333333',
  },
  modalDropdownHint: {
    padding: 10,
    fontSize: 12,
    color: '#777777',
  },
  modalErrorText: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 4,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#01304e',
    marginBottom: 8,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSubLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 6,
    marginTop: 4,
  },
  modalOptionsContainer: {
    marginBottom: 8,
  },
  modalOptionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modalOptionButtonSelected: {
    backgroundColor: '#01304e',
    borderColor: '#01304e',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#777777',
    fontWeight: '500',
  },
  modalOptionTextSelected: {
    color: '#FFFFFF',
  },
  editButton: {
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonDisabled: {
    opacity: 0.6,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },


  /* ---------- ADDED STYLES for refresh btn---------- */
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 1,
    marginBottom: 17,
    gap: 12,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ed8411',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  /* ---------- end added styles ---------- */

  /* ---------- Pricing & Discount Request Styles ---------- */
  pricingCard: {
    backgroundColor: '#01304e',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  negotiationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  statusMessageContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  statusPendingText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    color: '#E5E7EB',
    fontSize: 13,
  },
  statusAcceptedText: {
    color: '#ed8411',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusRejectedText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  discountForm: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  discountLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    lineHeight: 20,
  },
  discountInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  discountButton: {
    backgroundColor: '#ed8411',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  discountButtonDisabled: {
    opacity: 0.6,
  },
  discountButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  budgetDescription: {
    color: '#E5E7EB',
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  budgetLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  budgetAmount: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  wordsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 14,
    gap: 12,
  },
  wordsLabel: {
    color: '#ed8411',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  wordsValue: {
    color: '#ed8411',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  /* ---------- end Pricing & Discount Request Styles ---------- */

  /* ---------- Confirmation Section Styles ---------- */
  confirmationSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: '#01304e',
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#01304e',
    marginBottom: 12,
  },
  confirmationText: {
    fontSize: 14,
    color: '#555555',
    lineHeight: 22,
    marginBottom: 20,
  },
  confirmButton: {
    backgroundColor: '#1B873E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  confirmationNote: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* Map button styles */
  mapButton: {
    flex: 1,
    marginTop: 0,
    paddingVertical: 12,
    paddingHorizontal:6,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  /* ---------- end Confirmation Section Styles ---------- */
});









// old code

// import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, Linking, ActivityIndicator } from 'react-native';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { 
//   ArrowLeft, 
//   Truck, 
//   Package, 
//   Calendar, 
//   User,
//   ContainerIcon,
//   ClipboardList,
//   Phone 
// } from 'lucide-react-native';
// import { useBooking } from '../context/BookingContext';
// import { bookingAPI } from '../services/api';
// import Constants from 'expo-constants';
// import { useEffect, useState } from 'react';
// import { humanize } from '../utils';

// export default function BookingDetailScreen() {
//   const router = useRouter();
//   const { bookingId } = useLocalSearchParams();
//   const { bookings, getBookingById, updateBooking, cancelBooking } = useBooking();  const bookingFromContext = bookings.find(b => (b.id || b._id)?.toString() === bookingId);
//   const [editError, setEditError] = useState(null);
//   const [updating, setUpdating] = useState(false);
//   const [cancelling, setCancelling] = useState(false);
//   const [editVisible, setEditVisible] = useState(false);
//   const [form, setForm] = useState({
//     pickupLocation: '',
//     dropLocation: '',
//     cargoType: '',
//     vehicleType: '',
//     description: '',
//     cargoWeight: '',
//     cargoSize: '',
//     budget: '',
//   });
  
// // Driver location modal state
// const [locVisible, setLocVisible] = useState(false);
// const [locLoading, setLocLoading] = useState(false);
// const [locError, setLocError] = useState('');
// const [locData, setLocData] = useState(null); // { latitude, longitude, timestamp, speed, heading, accuracy, driver }
// const [locAddress, setLocAddress] = useState('');

//   const [booking, setBooking] = useState(() => {
//     if (!bookingFromContext) return null;
//     return {
//       id: bookingFromContext.id || bookingFromContext._id,
//       vehicleType: bookingFromContext.vehicleType,
//       loadType: bookingFromContext.cargoType || bookingFromContext.loadType,
//       fromLocation: bookingFromContext.pickupLocation || bookingFromContext.fromLocation,
//       toLocation: bookingFromContext.dropLocation || bookingFromContext.toLocation,
//       createdAt: bookingFromContext.createdAt,
//       status: bookingFromContext.status || 'Pending',
//       description: bookingFromContext.description,
//       cargoWeight: bookingFromContext.cargoWeight,
//       cargoSize: bookingFromContext.cargoSize,
//       budget: bookingFromContext.budget,
//     };
//   });
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     let mounted = true;
//     if (!bookingFromContext) {
//       (async () => {
//         try {
//           const data = await getBookingById(bookingId);
//           console.log("booking data", data)
//           if (!mounted) return;
//           const normalized = {
//             id: data?.id || data?._id,
//             vehicleType: data?.vehicleType,
//             loadType: data?.cargoType || data?.loadType,
//             fromLocation: data?.pickupLocation || data?.fromLocation,
//             toLocation: data?.dropLocation || data?.toLocation,
//             createdAt: data?.createdAt,
//             status: data?.status || 'Pending',
//             description: data?.description,
//             cargoWeight: data?.cargoWeight,
//             cargoSize: data?.cargoSize,
//             budget: data?.budget,
//           };
//           setBooking(normalized);
//         } catch (e) {
//           if (!mounted) return;
//           setError(e?.message || 'Failed to load booking');
//         }
//       })();
//     }
//     return () => { mounted = false; };
//   }, [bookingId]);

//   useEffect(() => {
//     console.log("booking", booking)
//     if (booking) {
//       setForm({
//         pickupLocation: booking.fromLocation || '',
//         dropLocation: booking.toLocation || '',
//         cargoType: booking.loadType || '',
//         vehicleType: booking.vehicleType || '',
//         description: booking.description || '',
//         cargoWeight: booking.cargoWeight ? String(booking.cargoWeight) : '',
//         cargoSize: booking.cargoSize || '',
//         budget: booking.budget ? String(booking.budget) : '',
//       });
//     }
//   }, [booking]);

//   if (error || !booking) {
//     return (
//       <View style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//             <ArrowLeft size={24} color="#1E293B" />
//           </TouchableOpacity>
//           <Text style={styles.title}>Booking Not Found</Text>
//         </View>
//         <View style={styles.errorContainer}>
//           <Text style={styles.errorText}>{error || 'This booking could not be found.'}</Text>
//         </View>
//       </View>
//     );
//   };

//   const formatDate = (dateString) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   const handleCancelBooking = () => {
//     const statusKey = (booking?.status || '').toLowerCase();
//     if (['delivered', 'completed', 'cancelled'].includes(statusKey)) {
//       Alert.alert('Not allowed', 'This booking cannot be cancelled.');
//       return;
//     }
//     Alert.alert('Cancel booking?', 'Are you sure you want to cancel this booking?', [
//       { text: 'No' },
//       {
//         text: 'Yes, cancel',
//         style: 'destructive',
//         onPress: async () => {
//           try {
//             setCancelling(true);
//             await cancelBooking(booking.id);
//             Alert.alert('Cancelled', 'Your booking has been cancelled.');
//           } catch (e) {
//             Alert.alert('Error', e?.message || 'Failed to cancel booking.');
//           } finally {
//             setCancelling(false);
//           }
//         },
//       },
//     ]);
//   };
  
//   const handleSaveEdit = async () => {
//     try {
//       setUpdating(true);
//       // Prepare partials only for filled fields
//       const payload = {};
//       if (form.pickupLocation) payload.pickupLocation = form.pickupLocation;
//       if (form.dropLocation) payload.dropLocation = form.dropLocation;
//       if (form.cargoType) payload.cargoType = form.cargoType;
//       if (form.vehicleType) payload.vehicleType = form.vehicleType;
//       if (form.description) payload.description = form.description;
//       if (form.cargoWeight !== '') payload.cargoWeight = form.cargoWeight;
//       if (form.cargoSize) payload.cargoSize = form.cargoSize;
//       if (form.budget !== '') payload.budget = form.budget;
  
//       await updateBooking(booking.id, payload);
//       setEditVisible(false);
//       Alert.alert('Updated', 'Your booking has been updated.');
//     } catch (e) {
//       Alert.alert('Error', e?.message || 'Failed to update booking.');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   // Build Google Maps directions URL pickup -> current (optional) -> drop
// const buildGoogleMapsDirUrl = (pickup, current, drop) => {
//   const p = encodeURIComponent(pickup || '');
//   const d = encodeURIComponent(drop || '');
//   if (current?.lat && current?.lng) {
//     return `https://www.google.com/maps/dir/${p}/${current.lat},${current.lng}/${d}`;
//   }
//   return `https://www.google.com/maps/dir/${p}/${d}`;
// };

// const reverseGeocode = async (lat, lng) => {
//   try {
//     const key = Constants?.expoConfig?.extra?.geoapifyKey || Constants?.manifest?.extra?.geoapifyKey;
//     if (!key) return null;
//     const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&apiKey=${encodeURIComponent(key)}`;
//     const r = await fetch(url);
//     const j = await r.json();
//     return j?.features?.[0]?.properties?.formatted || null;
//   } catch {
//     return null;
//   }
// };

// // Replace your existing fetchDriverLocation with this
// const fetchDriverLocation = async () => {
//   setLocLoading(true);
//   setLocError('');
//   setLocData(null);
//   setLocAddress('');
//   try {
//     const resp = await bookingAPI.currentLocation(booking.id);
//     // Axios response body or raw fetch fallback
//     const body = resp?.data ?? resp;
//     // Unwrap { success, data: {...} } if present
//     const container = body?.data ?? body;
//     // Prefer container.currentLocation, else container (for safety)
//     const current = container?.currentLocation ?? container;

//     const lat = current?.latitude;
//     const lng = current?.longitude;

//     if (typeof lat === 'number' && typeof lng === 'number') {
//       const addr = await reverseGeocode(lat, lng);
//       setLocAddress(addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
//       setLocData(current);
//     } else {
//       const msg = container?.message || body?.message || 'The driver has not shared their location yet.';
//       setLocError(msg);
//     }
//   } catch (e) {
//     setLocError(e?.message || 'Failed to fetch driver location');
//   } finally {
//     setLocLoading(false);
//   }
// };

// const openMaps = () => {
//   const url = buildGoogleMapsDirUrl(
//     booking.fromLocation,
//     locData?.latitude && locData?.longitude ? { lat: locData.latitude, lng: locData.longitude } : null,
//     booking.toLocation
//   );
//   Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open Google Maps.'));
// };

//   return (
//     <ScrollView
//       style={styles.container}
//       stickyHeaderIndices={[0]}
//       contentContainerStyle={{ paddingBottom: 24 }}
//       showsVerticalScrollIndicator={false}
//     >
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
//           <ArrowLeft size={24} color="#FFFFFF" />
//         </TouchableOpacity>
//         <ClipboardList size={32} color="#FFFFFF" style={{alignSelf: 'center'}} />
//         <Text style={styles.title}>Booking Details</Text>
//       </View>

//       <View style={styles.content}>
//         <View style={styles.statusSection}>
//           <Text style={styles.bookingId}>Booking id: C360-PK-{booking.id}</Text>
//           <View style={[
//             styles.statusBadge,
//             booking.status === 'Accepted' ? styles.statusAccepted : 
//             booking.status === 'Completed' ? styles.statusCompleted :
//             styles.statusPending
//           ]}>
//             <Text style={[
//               styles.statusText,
//               booking.status === 'Accepted' ? styles.statusTextAccepted :
//               booking.status === 'Completed' ? styles.statusTextCompleted :
//               styles.statusTextPending
//             ]}>
//               {booking.status}
//             </Text>
//           </View>
//         </View>

//         <View style={styles.detailsCard}>
//           <Text style={styles.cardTitle}>Vehicle & Load Information</Text>
          
//           <View style={styles.detailRow}>
//             <Truck size={20} color="#2563EB" />
//             <View style={styles.detailContent}>
//               <Text style={styles.detailLabel}>Vehicle Type</Text>
//               <Text style={styles.detailValue}>{humanize(booking.vehicleType)}</Text>
//             </View>
//           </View>

//           <View style={styles.detailRow}>
//             <Package size={20} color="#059669" />
//             <View style={styles.detailContent}>
//               <Text style={styles.detailLabel}>Cargo Type</Text>
//               <Text style={styles.detailValue}>{humanize(booking.loadType)}</Text>
//             </View>
//           </View>

//           <View style={styles.detailRow}>
//             <ContainerIcon size={20} color="aqua" />
//             <View style={styles.detailContent}>
//               <Text style={styles.detailLabel}>Cargo Weight (kg)</Text>
//               <Text style={styles.detailValue}>{booking.cargoWeight || 'N/A'}</Text>
//             </View>
//           </View>

//           {booking.description && (
//             <View style={styles.descriptionSection}>
//               <Text style={styles.detailLabel}>Additional Details</Text>
//               <Text style={styles.descriptionText}>{booking.description}</Text>
//             </View>
//           )}
//         </View>

//         <View style={styles.detailsCard}>
//           <Text style={styles.cardTitle}>Route Information</Text>
          
//           <View style={styles.routeContainer}>
//             <View style={styles.routePoint}>
//               <View style={styles.routeDotStart} />
//               <View style={styles.routeInfo}>
//                 <Text style={styles.routeLabel}>Pickup Location</Text>
//                 <Text style={styles.routeAddress}>{booking.fromLocation}</Text>
//               </View>
//             </View>

//             <View style={styles.routeConnector} />

//             <View style={styles.routePoint}>
//               <View style={styles.routeDotEnd} />
//               <View style={styles.routeInfo}>
//                 <Text style={styles.routeLabel}>Delivery Location</Text>
//                 <Text style={styles.routeAddress}>{booking.toLocation}</Text>
//               </View>
//             </View>
//           </View>
//         </View>

//         <View style={styles.detailsCard}>
//           <Text style={styles.cardTitle}>Booking Information</Text>
          
//           <View style={styles.detailRow}>
//             <Calendar size={20} color="#EA580C" />
//             <View style={styles.detailContent}>
//               <Text style={styles.detailLabel}>Requested On</Text>
//               <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
//             </View>
//           </View>
//         </View>

//         {booking.status === 'Accepted' && (
//           <View style={styles.detailsCard}>
//             <Text style={styles.cardTitle}>Driver Information</Text>
            
//             <View style={styles.driverInfo}>
//               <View style={styles.driverAvatar}>
//                 <User size={24} color="#FFFFFF" />
//               </View>
//               <View style={styles.driverDetails}>
//                 <Text style={styles.driverName}>Mike Johnson</Text>
//                 <Text style={styles.driverRating}>⭐ 4.8 (127 reviews)</Text>
//                 <Text style={styles.driverVehicle}>Truck License: ABC-1234</Text>
//               </View>
//             </View>

//             <TouchableOpacity style={styles.contactButton}>
//               <Phone size={20} color="#FFFFFF" />
//               <Text style={styles.contactButtonText}>Contact Driver</Text>
//             </TouchableOpacity>
//           </View>
//         )}

//         {booking.status === 'Pending' && (
//           <>
//             <View style={styles.pendingInfo}>
//               <Text style={styles.pendingTitle}>Looking for a driver...</Text>
//               <Text style={styles.pendingText}>
//                 We're searching for available drivers in your area. You'll be notified once a driver accepts your request.
//               </Text>
//             </View>
//             <View style={{ marginTop: 12, gap: 12 }}>
//               <TouchableOpacity
//                 onPress={() => setEditVisible(true)}
//                 disabled={updating}
//                 style={{ backgroundColor: '#2563EB', opacity: updating ? 0.6 : 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
//               >
//                 <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
//                   {updating ? 'Updating...' : 'Edit Booking'}
//                 </Text>
//               </TouchableOpacity>

//               <TouchableOpacity
//                 onPress={handleCancelBooking}
//                 disabled={cancelling}
//                 style={{ backgroundColor: '#DC2626', opacity: cancelling ? 0.6 : 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
//               >
//                 <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
//                   {cancelling ? 'Cancelling...' : 'Cancel Booking'}
//                 </Text>
//               </TouchableOpacity>
//             </View>
//           </>
//         )}
//         {['picked_up', 'in_transit'].includes(booking.status.toLowerCase()) && (
//         <View style={{ marginTop: 12 }}>
//           <TouchableOpacity
//             onPress={() => { setLocVisible(true); fetchDriverLocation(); }}
//             style={{ backgroundColor: '#0EA5E9', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
//           >
//             <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>See Driver Location</Text>
//           </TouchableOpacity>
//         </View>
//       )}
//       </View>
//       {/* Edit Modal */}
//       <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Edit Booking</Text>

//             <TextInput style={styles.modalInput} placeholder="Pickup Location" value={form.pickupLocation} onChangeText={(t) => setForm((s) => ({ ...s, pickupLocation: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Drop Location" value={form.dropLocation} onChangeText={(t) => setForm((s) => ({ ...s, dropLocation: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Cargo Type" value={form.cargoType} onChangeText={(t) => setForm((s) => ({ ...s, cargoType: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Vehicle Type" value={form.vehicleType} onChangeText={(t) => setForm((s) => ({ ...s, vehicleType: t }))} />
//             <TextInput style={[styles.modalInput, { height: 80 }]} placeholder="Description" multiline value={form.description} onChangeText={(t) => setForm((s) => ({ ...s, description: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Cargo Weight" keyboardType="numeric" value={form.cargoWeight} onChangeText={(t) => setForm((s) => ({ ...s, cargoWeight: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Cargo Size" value={form.cargoSize} onChangeText={(t) => setForm((s) => ({ ...s, cargoSize: t }))} />
//             <TextInput style={styles.modalInput} placeholder="Budget" keyboardType="numeric" value={form.budget} onChangeText={(t) => setForm((s) => ({ ...s, budget: t }))} />

//             <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
//               <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#64748B' }]} onPress={() => setEditVisible(false)}>
//                 <Text style={styles.modalButtonText}>Close</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2563EB' }]} onPress={handleSaveEdit} disabled={updating}>
//                 <Text style={styles.modalButtonText}>{updating ? 'Saving...' : 'Save'}</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>
//       {/* Driver Location Modal */}
//       <Modal visible={locVisible} transparent animationType="slide" onRequestClose={() => setLocVisible(false)}>
//         <View style={styles.modalBackdrop}>
//           <View style={styles.modalCard}>
//             <Text style={styles.modalTitle}>Driver Location</Text>

//             {locLoading ? (
//               <View style={{ alignItems: 'center', paddingVertical: 12 }}>
//                 <ActivityIndicator color="#2563EB" />
//                 <Text style={{ color: '#64748B', marginTop: 8 }}>Fetching current location…</Text>
//               </View>
//             ) : (
//               <>
//                 {locError ? (
//                   <Text style={{ color: '#DC2626', marginBottom: 8 }}>{locError}</Text>
//                 ) : (
//                   <>
//                     <Text style={{ color: '#1E293B', fontWeight: '600', marginBottom: 6 }}>
//                       Booking #{booking.id}
//                     </Text>
//                     {locAddress ? (
//                       <Text style={{ color: '#1E293B', marginBottom: 6 }}>Address: {locAddress}</Text>
//                     ) : null}
//                     {locData?.driver?.name || locData?.driver?.phone ? (
//                       <Text style={{ color: '#64748B', marginBottom: 6 }}>
//                         Driver: {locData?.driver?.name || 'N/A'}{locData?.driver?.phone ? ` · ${locData.driver.phone}` : ''}
//                       </Text>
//                     ) : null}
//                     <Text style={{ color: '#64748B', marginBottom: 6 }}>
//                       Last updated: {locData?.timestamp ? new Date(locData.timestamp).toLocaleString() : 'N/A'}
//                     </Text>
//                     {typeof locData?.speed === 'number' ? (
//                       <Text style={{ color: '#64748B' }}>Speed: {locData.speed} km/h</Text>
//                     ) : null}
//                     {typeof locData?.heading === 'number' ? (
//                       <Text style={{ color: '#64748B' }}>Heading: {locData.heading}°</Text>
//                     ) : null}
//                     {typeof locData?.accuracy === 'number' ? (
//                       <Text style={{ color: '#64748B' }}>Accuracy: {locData.accuracy} m</Text>
//                     ) : null}
//                   </>
//                 )}

//                 <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
//                   <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0EA5E9' }]} onPress={fetchDriverLocation}>
//                     <Text style={styles.modalButtonText}>Refresh Location</Text>
//                   </TouchableOpacity>
//                   <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#059669' }]} onPress={openMaps}>
//                     <Text style={styles.modalButtonText}>See on Maps</Text>
//                   </TouchableOpacity>
//                 </View>

//                 <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#64748B', marginTop: 12 }]} onPress={() => setLocVisible(false)}>
//                   <Text style={styles.modalButtonText}>Close</Text>
//                 </TouchableOpacity>
//               </>
//             )}
//           </View>
//         </View>
//       </Modal>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#F8FAFC',
//   },
//   header: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingTop: 50,
//     paddingBottom: 15,
//     paddingHorizontal: 24,
//     backgroundColor: '#024d9a',
//     color: '#FFFFFF',
//     gap: 16,
//     marginBottom: 24,
//     zIndex: 10,
//     elevation: 4,               // Android
//     shadowColor: '#000',        // iOS
//     shadowOpacity: 0.08,
//     shadowRadius: 6,
//     shadowOffset: { width: 0, height: 3 },
//     height: 180,
//     borderBottomLeftRadius: 60,
//     borderBottomRightRadius: 60,
//   },
//   backButton: {
//     padding: 8,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginTop: 12,
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 14,
//     color: 'white',
//     textAlign: 'center',
//   },
//   content: {
//     paddingHorizontal: 24,
//     paddingBottom: 100,
//   },
//   statusSection: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   bookingId: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1E293B',
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 8,
//   },
//   statusAccepted: {
//     backgroundColor: '#DCFCE7',
//   },
//   statusCompleted: {
//     backgroundColor: '#DBEAFE',
//   },
//   statusPending: {
//     backgroundColor: '#FEF3C7',
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: '600',
//   },
//   statusTextAccepted: {
//     color: '#059669',
//   },
//   statusTextCompleted: {
//     color: '#2563EB',
//   },
//   statusTextPending: {
//     color: '#D97706',
//   },
//   detailsCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 20,
//     marginBottom: 16,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//     marginBottom: 16,
//   },
//   detailRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     marginBottom: 16,
//     gap: 12,
//   },
//   detailContent: {
//     flex: 1,
//   },
//   detailLabel: {
//     fontSize: 12,
//     color: '#94A3B8',
//     marginBottom: 4,
//   },
//   detailValue: {
//     fontSize: 14,
//     color: '#1E293B',
//     fontWeight: '500',
//   },
//   descriptionSection: {
//     marginTop: 8,
//     paddingTop: 16,
//     borderTopWidth: 1,
//     borderTopColor: '#F1F5F9',
//   },
//   descriptionText: {
//     fontSize: 14,
//     color: '#64748B',
//     lineHeight: 20,
//     marginTop: 4,
//   },
//   routeContainer: {
//     paddingVertical: 8,
//   },
//   routePoint: {
//     flexDirection: 'row',
//     alignItems: 'flex-start',
//     gap: 12,
//   },
//   routeDotStart: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#059669',
//     marginTop: 4,
//   },
//   routeDotEnd: {
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     backgroundColor: '#DC2626',
//     marginTop: 4,
//   },
//   routeConnector: {
//     width: 2,
//     height: 24,
//     backgroundColor: '#E2E8F0',
//     marginLeft: 5,
//     marginVertical: 8,
//   },
//   routeInfo: {
//     flex: 1,
//   },
//   routeLabel: {
//     fontSize: 12,
//     color: '#94A3B8',
//     marginBottom: 4,
//   },
//   routeAddress: {
//     fontSize: 14,
//     color: '#1E293B',
//     fontWeight: '500',
//   },
//   driverInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//     gap: 12,
//   },
//   driverAvatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//     backgroundColor: '#2563EB',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   driverDetails: {
//     flex: 1,
//   },
//   driverName: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1E293B',
//     marginBottom: 2,
//   },
//   driverRating: {
//     fontSize: 12,
//     color: '#64748B',
//     marginBottom: 2,
//   },
//   driverVehicle: {
//     fontSize: 12,
//     color: '#94A3B8',
//   },
//   contactButton: {
//     backgroundColor: '#059669',
//     borderRadius: 8,
//     paddingVertical: 12,
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//   },
//   contactButtonText: {
//     color: '#FFFFFF',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   pendingInfo: {
//     backgroundColor: '#FFFBEB',
//     borderRadius: 12,
//     padding: 20,
//     borderWidth: 1,
//     borderColor: '#FEF3C7',
//     alignItems: 'center',
//   },
//   pendingTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#D97706',
//     marginBottom: 8,
//   },
//   pendingText: {
//     fontSize: 14,
//     color: '#92400E',
//     textAlign: 'center',
//     lineHeight: 20,
//   },
//   errorContainer: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingHorizontal: 24,
//   },
//   errorText: {
//     fontSize: 16,
//     color: '#64748B',
//     textAlign: 'center',
//   },
//   modalBackdrop: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.4)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 24,
//   },
//   modalCard: {
//     backgroundColor: '#FFFFFF',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     width: '100%',
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#1E293B',
//     marginBottom: 12,
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: '#E2E8F0',
//     borderRadius: 8,
//     paddingHorizontal: 12,
//     paddingVertical: 10,
//     marginBottom: 10,
//     color: '#1E293B',
//     backgroundColor: '#FFFFFF',
//   },
//   modalButton: {
//     flex: 1,
//     borderRadius: 8,
//     paddingVertical: 12,
//     alignItems: 'center',
//   },
//   modalButtonText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
// });