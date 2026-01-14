import React, { createContext, useContext, useEffect, useMemo, useState, useRef } from 'react';
import { authAPI, bookingAPI, setTokens, clearTokens } from '../services/api';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const lastFetchedAtRef = useRef(0);
  const inFlightRef = useRef(null);
  const CACHE_TTL_MS = 15000; // 15s cache window to reduce churn on focus

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await authAPI.me();
        if (!mounted) return;
        // API returns { user: { ... } } or user directly
        const userData = data?.user || data;
        setUser(userData);
        await fetchBookings(undefined, { force: true });
      } catch (_e) {
        await clearTokens();
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          setAuthReady(true);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  async function login(email, password) {
    try {
      setLoading(true);
      const { data } = await authAPI.login(email, password);
      if (data?.accessToken) {
        await setTokens(data.accessToken, data?.refreshToken);
      }
      if (data?.user) {
        setUser(data.user);
      } else {
        const me = await authAPI.me();
        // API returns { user: { ... } } or user directly
        const userData = me.data?.user || me.data;
        setUser(userData);
      }
      await fetchBookings(undefined, { force: true });
      return true;
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signup({ name, email, company, phone, password }) {
    try {
      setLoading(true);
      const { data } = await authAPI.signup({ name, email, company, phone, password });
      return data; // Return data so the component can handle UI (Alert/navigation)
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await clearTokens();
    setUser(null);
    setBookings([]);
    lastFetchedAtRef.current = 0;
  }

  async function fetchBookings(status, options = {}) {
    const { force = false } = options;
    const now = Date.now();
    if (!force && bookings.length && now - lastFetchedAtRef.current < CACHE_TTL_MS) {
      return bookings;
    }
    if (inFlightRef.current) return inFlightRef.current;

    const run = (async () => {
      try {
        const resp = await bookingAPI.mine(status);
        const raw = resp?.data; // may be { success, data: {...} } or array
        const container = raw?.data ?? raw; // unwrap one level if present
        let list = [];
        if (Array.isArray(container)) list = container;
        else if (Array.isArray(container?.items)) list = container.items;
        else if (Array.isArray(container?.shipments)) list = container.shipments;
        else if (Array.isArray(container?.results)) list = container.results;
        else list = [];

        setBookings(list);
        lastFetchedAtRef.current = Date.now();
        return list;
      } catch (e) {
        throw e;
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  }

  async function addBooking({ vehicleType, loadType, fromLocation, toLocation, description, cargoWeight, cargoSize, budget, numContainers, numberOfVehicles, pickupDate, deliveryDate, insurance, salesTax, companyName }) {
    const payload = {
      pickupLocation: fromLocation,
      dropLocation: toLocation,
      cargoType: loadType, // mapped
      description,
      vehicleType,
      ...(cargoWeight ? { cargoWeight } : {}),
      ...(cargoSize ? { cargoSize } : {}),
      ...(budget ? { budget } : {}),
      ...(numContainers ? { numContainers } : {}),
      ...(numberOfVehicles ? { numberOfVehicles } : {}),
      ...(pickupDate ? { pickupDate } : {}),
      ...(deliveryDate ? { deliveryDate } : {}),
      ...(insurance !== undefined ? { insurance } : {}),
      ...(salesTax !== undefined ? { salesTax } : {}),
      platform: "mobile", // Track that booking is from mobile app - must be last to ensure it's not overwritten
    };
    console.log("Booking payload being sent:", JSON.stringify(payload, null, 2));
    const { data } = await bookingAPI.create(payload);
    await fetchBookings(undefined, { force: true });
    return data;
  }

  async function getBookingById(id) {
    const local = bookings.find((b) => `${b.id || b._id}` === `${id}`);
    if (local) return local;
    const resp = await bookingAPI.get(id);
    const raw = resp?.data;
    const value = raw?.data ?? raw; // unwrap if wrapped
    return value;
  }

  async function updateBooking(id, payload) {
    const resp = await bookingAPI.update(id, payload);
    await fetchBookings(undefined, { force: true });
    const raw = resp?.data;
    const value = raw?.data ?? raw;
    return value;
  }

  async function cancelBooking(id, reason) {
    const payload = reason ? { cancelReason: reason } : {};
    const resp = await bookingAPI.cancel(id, payload);
    await fetchBookings(undefined, { force: true });
    const raw = resp?.data;
    const value = raw?.data ?? raw;
    return value;
  }

  const value = useMemo(() => ({
    user,
    bookings,
    loading,
    authReady,
    login,
    signup,
    logout,
    fetchBookings,
    addBooking,
    getBookingById,
    updateBooking,
    cancelBooking,
  }), [user, bookings, loading, authReady]);

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}