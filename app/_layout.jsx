import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BookingProvider } from '../context/BookingContext';
import { NotificationProvider } from '../context/NotificationContext';
import { SocketProvider } from '../context/SocketContext';
import SocketNotificationHandler from '../components/SocketNotificationHandler';

function useFrameworkReady() {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.frameworkReady) {
      window.frameworkReady();
    }
  });
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <BookingProvider>
      <NotificationProvider>
        <SocketProvider>
          <SocketNotificationHandler />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="clearance-detail" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </SocketProvider>
      </NotificationProvider>
    </BookingProvider>
  );
}