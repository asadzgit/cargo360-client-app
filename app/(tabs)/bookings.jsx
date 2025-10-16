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
} from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { humanize } from '../../utils';

export default function BookingStatusScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { bookings, fetchBookings } = useBooking();

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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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

      <ScrollView 
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
    backgroundColor: '#024d9a',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 24,
    height: 180,
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
    color: '#64748B',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
  },
  statusCompleted: {
    backgroundColor: '#DBEAFE',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusTextAccepted: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: '#2563EB',
  },
  statusTextPending: {
    color: '#D97706',
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
    color: '#64748B',
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
    color: '#64748B',
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
    color: '#94A3B8',
  },
});