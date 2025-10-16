import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, ClipboardList, User, MapPin } from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';

export default function HomeScreen() {
  const router = useRouter();
  const { user, bookings } = useBooking();

  const pendingBookings = bookings.filter(booking => booking.status === 'Pending').length;
  const acceptedBookings = bookings.filter(booking => booking.status === 'Accepted').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Image 
            source={require('../../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{acceptedBookings}</Text>
          <Text style={styles.statLabel}>Accepted</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.primaryAction}
          onPress={() => router.push('/(tabs)/book-truck')}
        >
          <Truck size={24} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Book a Vehicle</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryAction}
          onPress={() => router.push('/(tabs)/bookings')}
        >
          <ClipboardList size={24} color="#2563EB" />
          <Text style={styles.secondaryActionText}>View My Bookings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {bookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Truck size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Start by booking your first vehicle</Text>
          </View>
        ) : (
          <View style={styles.recentBookings}>
            {bookings.slice(0, 3).map((booking) => (
              <TouchableOpacity 
                key={booking.id || booking._id} 
                style={styles.recentBookingCard}
                onPress={() => router.push({ pathname: '/booking-detail', params: { bookingId: booking.id || booking._id } })}
              >
                <View style={styles.recentBookingInfo}>
                  <Text style={styles.recentBookingTitle}>{booking.vehicleType}</Text>
                  <Text style={styles.recentBookingRoute}>
                    {booking.fromLocation.substring(0, 50).concat('...')} <MapPin />...<MapPin /> {booking.toLocation.substring(0, 50).concat('...')}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge,
                  booking.status === 'Accepted' ? styles.statusAccepted : styles.statusPending
                ]}>
                  <Text style={[
                    styles.statusText,
                    booking.status === 'Accepted' ? styles.statusTextAccepted : styles.statusTextPending
                  ]}>
                    {booking.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563EB',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  actionsContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    gap: 16,
  },
  primaryAction: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryActionText: {
    color: '#2563EB',
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  recentBookings: {
    gap: 12,
  },
  recentBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recentBookingInfo: {
    flex: 1,
  },
  recentBookingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  recentBookingRoute: {
    fontSize: 12,
    color: '#64748B',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAccepted: {
    backgroundColor: '#DCFCE7',
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
  statusTextPending: {
    color: '#D97706',
  },
});