// // changes start from here---
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, RefreshControl, Modal} from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, ClipboardList, User, MapPin, RefreshCw, Plus} from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';
import { humanize } from '../../utils';
import { useState, useCallback } from 'react';
import ClearanceModal from '../ClearanceModal';

export default function HomeScreen() {
  const router = useRouter();
  const { user, bookings, fetchBookings } = useBooking();

  const [refreshing, setRefreshing] = useState(false);
  // 🔸 Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onRefresh = useCallback(async () => {
  try {
    setRefreshing(true);
    await fetchBookings(undefined, { force: true });
  } catch (error) {
    console.error('Error refreshing bookings:', error);
  } finally {
    setRefreshing(false);
  }
}, [fetchBookings]);



  const pendingBookings = bookings.filter(booking => booking.status.toLowerCase() === 'pending').length;
  const acceptedBookings = bookings.filter(booking => booking.status.toLowerCase() === 'accepted').length;

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
      <ScrollView
  style={{ marginBottom: 10 }}
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={['#2563EB']}
      tintColor="#2563EB"
    />
  }
>
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

  {/* New Row with two half buttons */}
  <View style={styles.halfRow}>
    <TouchableOpacity 
      style={styles.halfButtonLeft}
      onPress={() => setIsModalOpen(true)}
    >
      <Plus size={20} color="#2563EB" />
      <Text style={styles.halfButtonText}>Clearance Doc</Text>
    </TouchableOpacity>

    <TouchableOpacity 
      style={styles.halfButtonRight}
      onPress={() => router.push('/(tabs)/bookings')}
    >
      <ClipboardList size={20} color="#2563EB" />
      <Text style={styles.halfButtonText}>My Bookings</Text>
    </TouchableOpacity>
  </View>

  {/* Clearance Modal */}
  <ClearanceModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
</View>


        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
    <Text style={styles.sectionTitle}>Recent Activity</Text>
    <TouchableOpacity
      style={styles.refreshInlineButton}
      onPress={onRefresh}
      disabled={refreshing}
    >
      <RefreshCw size={16} color="#FFFFFF" />
      <Text style={styles.refreshInlineText}>
        {refreshing ? 'Refreshing...' : 'Refresh'}
      </Text>
    </TouchableOpacity>
  </View>

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
                    <Text style={styles.recentBookingId}>C360-PK-{booking.id}</Text>
                    <Text style={styles.recentBookingTitle}>{humanize(booking.vehicleType)}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 32,
    paddingTop: 50,
    backgroundColor: '#024d9a',
    height: 180,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    backgroundColor: '#ffff',
    borderRadius: 60,
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
  recentBookingId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 4,
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
  recentHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  },
  refreshInlineButton: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#ed8411',
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 8,
  marginTop:-17,
},

refreshInlineText: {
  color: '#FFFFFF',
  fontSize: 13,
  fontWeight: '600',
  marginLeft: 6,
},

// 🔸 Add these styles
addDocButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 8,
  paddingVertical: 8,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: '#E2E8F0',
  alignSelf: 'flex-start',
  marginTop: 8,
},
addDocText: {
  color: '#000000',
  fontSize: 14,
  fontWeight: '600',
  marginLeft: 6,
},
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  width: '80%',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 20,
  color: '#1E293B',
},
modalCloseButton: {
  backgroundColor: '#2563EB',
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 20,
},
modalCloseText: {
  color: '#FFFFFF',
  fontWeight: '600',
},

halfRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: 8,
},

halfButtonLeft: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  // padding: 16,
  height: 60,
  borderWidth: 1,
  borderColor: '#E2E8F0',
},

halfButtonRight: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  // paddingLeft: 1,
  borderWidth: 1,
  height: 60,
  borderColor: '#E2E8F0',
},

halfButtonText: {
  color: '#2563EB',
  fontSize: 15,
  fontWeight: '600',
  marginLeft: 2,
},

});


// changes----