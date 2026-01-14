import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useBooking } from '../context/BookingContext';

/**
 * Component that listens to socket notifications and handles data refreshes
 * This should be placed inside both SocketProvider and BookingProvider
 */
export default function SocketNotificationHandler() {
  const { socket, isConnected } = useSocket();
  const { fetchBookings } = useBooking();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for notifications directly from the socket
    const handleNotification = (notification) => {
      console.log('[SocketNotificationHandler] Handling notification:', notification);
      
      const { data } = notification;
      
      // Refresh bookings when shipment updates are received
      if (data?.type === 'shipment_update' || data?.shipmentId) {
        console.log('[SocketNotificationHandler] Refreshing bookings due to shipment update');
        fetchBookings(undefined, { force: true }).catch((error) => {
          console.error('[SocketNotificationHandler] Error refreshing bookings:', error);
        });
      }
      
      // Refresh bookings for profile updates too (in case user data affects bookings)
      if (data?.type === 'profile_updated') {
        console.log('[SocketNotificationHandler] Refreshing bookings due to profile update');
        fetchBookings(undefined, { force: true }).catch((error) => {
          console.error('[SocketNotificationHandler] Error refreshing bookings:', error);
        });
      }
    };

    // Listen to the notification event from the server
    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, isConnected, fetchBookings]);

  // This component doesn't render anything
  return null;
}

