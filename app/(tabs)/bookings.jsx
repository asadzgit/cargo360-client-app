// changes start ---
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  ClipboardList, 
  Truck, 
  MapPin, 
  Calendar, 
  ChevronRight,
  Package,
  WeightIcon,
  RefreshCcw,
} from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { humanize } from '../../utils';
import WhatsAppButton from '../../components/WhatsAppButton';

export default function BookingStatusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { bookings, fetchBookings } = useBooking();
  const scrollViewRef = useRef(null);

  // Fetch on initial mount
  useEffect(() => {
    (async () => {
      try { await fetchBookings(); } catch (_) {}
    })();
  }, []);

  // Re-fetch when the screen gains focus
  useFocusEffect(
    useCallback(() => {
      let active = true;
      // Scroll to top when screen is focused
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      (async () => {
        try { if (active) await fetchBookings(); } catch (_) {}
      })();
      return () => { active = false; };
    }, [fetchBookings])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchBookings();
    } finally {
      setRefreshing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const year = date.getFullYear();

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert to 12-hour format
    const formattedHours = String(hours).padStart(2, '0');

    return `${day}/${month}/${year} - ${formattedHours}:${minutes} ${ampm}`;
  };

  const handleBookingPress = (booking) => {
    router.push({
      pathname: '/booking-detail',
      params: { bookingId: booking.id || booking._id }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ClipboardList size={32} color="#FFFFFF" />
        <Text style={styles.title}>My Bookings</Text>
        <Text style={styles.subtitle}>Track all your booking requests</Text>
      </View>

      {/* ✅ Refresh Button */}
      <View style={styles.refreshRow}>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <RefreshCcw size={16} color="#fff" />
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </View>


      <ScrollView 
        ref={scrollViewRef}
        style={styles.bookingsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No bookings yet</Text>
            <Text style={styles.emptyText}>
              Your booking requests will appear here once you make them.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => router.push('/(tabs)/book-truck')}
            >
              <Text style={styles.emptyButtonText}>Book Your First Vehicle</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {bookings.map((booking) => (
              <TouchableOpacity 
                key={booking.id || booking._id}
                style={styles.bookingCard}
                onPress={() => handleBookingPress(booking)}
              >
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingId}>C360-PK-{booking.id || booking._id}</Text>
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
                  <ChevronRight size={20} color="#94A3B8" />
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Truck size={16} color="#64748B" />
                    <Text style={styles.detailText}>{humanize(booking.vehicleType)}</Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Package size={16} color="#64748B" />
                    <Text style={styles.detailText}>{humanize(booking.cargoType)}</Text>
                  </View>

                  {booking.cargoWeight && (
                    <View style={styles.detailRow}>
                      <WeightIcon size={16} color="#64748B" />
                      <Text style={styles.detailText}>{booking.cargoWeight} kg</Text>
                    </View>
                  )}

                  <View style={styles.routeContainer}>
                    <View style={styles.routeRow}>
                      <MapPin size={16} color="#059669" />
                      <Text style={styles.routeText}>{booking.pickupLocation || booking.fromLocation}</Text>
                    </View>
                    <View style={styles.routeConnector} />
                    <View style={styles.routeRow}>
                      <MapPin size={16} color="#DC2626" />
                      <Text style={styles.routeText}>{booking.dropLocation || booking.toLocation}</Text>
                    </View>
                  </View>

                  <View style={styles.dateRow}>
                    <Calendar size={14} color="#94A3B8" />
                    <Text style={styles.dateText}>
                      Requested on {formatDate(booking.createdAt)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      <WhatsAppButton accessibilityLabel="Contact Cargo360 support on WhatsApp" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: '#01304e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 24,
    height: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  bookingsList: {
    flex: 1,
    paddingHorizontal: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#01304e',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bookingsContainer: {
    paddingBottom: 100,
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#01304e',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 11,
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
  bookingDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#777777',
    flex: 1,
  },
  routeContainer: {
    paddingLeft: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeConnector: {
    width: 2,
    height: 16,
    backgroundColor: '#E2E8F0',
    marginLeft: 7,
    marginVertical: 4,
  },
  routeText: {
    fontSize: 14,
    color: '#777777',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
  },


  // Refresh button style
  refreshRow: {
  flexDirection: 'row',
  justifyContent: 'flex-end', // align button to right side
  alignItems: 'center',
  paddingHorizontal: 24,
  marginBottom: 16,
},

refreshButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ed8411',
  paddingVertical: 6,
  paddingHorizontal: 9,
  borderRadius: 8,
  gap: 6,
},

refreshButtonText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '600',
},

});