import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  MapPin,
  Calendar, 
  User,
  
  Phone 
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { useEffect, useState } from 'react';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { bookings, getBookingById } = useBooking();
  const bookingFromContext = bookings.find(b => (b.id || b._id)?.toString() === bookingId);
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
    };
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!bookingFromContext) {
      (async () => {
        try {
          const data = await getBookingById(bookingId);
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
          };
          setBooking(normalized);
        } catch (e) {
          if (!mounted) return;
          setError(e?.message || 'Failed to load booking');
        }
      })();
    }
    return () => { mounted = false; };
  }, [bookingId]);

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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>Booking Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusSection}>
          <Text style={styles.bookingId}>Booking #{booking.id}</Text>
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
            <Truck size={20} color="#2563EB" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle Type</Text>
              <Text style={styles.detailValue}>{booking.vehicleType}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Package size={20} color="#059669" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Load Type</Text>
              <Text style={styles.detailValue}>{booking.loadType}</Text>
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
              <View style={styles.routeDotStart} />
              <View style={styles.routeInfo}>
                <Text style={styles.routeLabel}>Pickup Location</Text>
                <Text style={styles.routeAddress}>{booking.fromLocation}</Text>
              </View>
            </View>

            <View style={styles.routeConnector} />

            <View style={styles.routePoint}>
              <View style={styles.routeDotEnd} />
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
            <Calendar size={20} color="#EA580C" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Requested On</Text>
              <Text style={styles.detailValue}>{formatDate(booking.createdAt)}</Text>
            </View>
          </View>
        </View>

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
          <View style={styles.pendingInfo}>
            <Text style={styles.pendingTitle}>Looking for a driver...</Text>
            <Text style={styles.pendingText}>
              We're searching for available drivers in your area. You'll be notified once a driver accepts your request.
            </Text>
          </View>
        )}
      </View>
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
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
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
    color: '#1E293B',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
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
    fontSize: 12,
    fontWeight: '600',
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
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  descriptionSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  descriptionText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 4,
  },
  routeContainer: {
    paddingVertical: 8,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    width: 2,
    height: 24,
    backgroundColor: '#E2E8F0',
    marginLeft: 5,
    marginVertical: 8,
  },
  routeInfo: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  routeAddress: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
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
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  driverRating: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: '#94A3B8',
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
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FEF3C7',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
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
    color: '#64748B',
    textAlign: 'center',
  },
});