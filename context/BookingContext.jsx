import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, bookingAPI, setTokens, clearTokens } from '../services/api';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await authAPI.me();
        setUser(data);
        await fetchBookings();
      } catch (_e) {
        // no-op: not logged in or token invalid
      } finally {
        setLoading(false);
      }
    })();
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
        setUser(me.data);
      }
      await fetchBookings();
      return true;
    } catch (e) {
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signup({ name, email, phone, password }) {
    try {
      setLoading(true);
      const { data } = await authAPI.signup({ name, email, phone, password });
      if (data?.accessToken) {
        await setTokens(data.accessToken, data?.refreshToken);
        if (data?.user) setUser(data.user); else {
          const me = await authAPI.me();
          setUser(me.data);
        }
      } else {
        // fallback: login after signup
        await login(email, password);
      }
      return true;
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
  }

  async function fetchBookings(status) {
    try {
      const { data } = await bookingAPI.mine(status);
      setBookings(Array.isArray(data) ? data : data?.items || []);
    } catch (e) {
      // surface to caller if needed
      throw e;
    }
  }

  async function addBooking({ vehicleType, loadType, fromLocation, toLocation, description, cargoWeight, cargoSize, budget }) {
    const payload = {
      pickupLocation: fromLocation,
      dropLocation: toLocation,
      cargoType: loadType, // mapped
      description,
      vehicleType,
      ...(cargoWeight ? { cargoWeight } : {}),
      ...(cargoSize ? { cargoSize } : {}),
      ...(budget ? { budget } : {}),
    };
    const { data } = await bookingAPI.create(payload);
    await fetchBookings();
    return data;
  }

  async function getBookingById(id) {
    const local = bookings.find((b) => `${b.id}` === `${id}`);
    if (local) return local;
    const { data } = await bookingAPI.get(id);
    return data;
  }

  const value = useMemo(() => ({
    user,
    bookings,
    loading,
    login,
    signup,
    logout,
    fetchBookings,
    addBooking,
    getBookingById,
  }), [user, bookings, loading]);

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