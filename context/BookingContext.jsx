import React, { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export function BookingProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);

  const login = (email, password) => {
    // Simple mock login
    setUser({ email, id: Date.now() });
    return true;
  };

  const signup = (email, password) => {
    // Simple mock signup
    setUser({ email, id: Date.now() });
    return true;
  };

  const logout = () => {
    setUser(null);
    setBookings([]);
  };

  const addBooking = (bookingData) => {
    const newBooking = {
      id: Date.now(),
      ...bookingData,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    setBookings(prev => [...prev, newBooking]);
    return newBooking;
  };

  const updateBookingStatus = (bookingId, status) => {
    setBookings(prev => 
      prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status }
          : booking
      )
    );
  };

  const value = {
    user,
    bookings,
    login,
    signup,
    logout,
    addBooking,
    updateBookingStatus,
  };

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