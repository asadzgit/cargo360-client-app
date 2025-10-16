import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, Linking, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Truck, 
  Package, 
  Calendar, 
  User,
  ContainerIcon,
  ClipboardList,
  Phone 
} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { bookingAPI } from '../services/api';
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { humanize } from '../utils';

export default function BookingDetailScreen() {
  const router = useRouter();
  const { bookingId } = useLocalSearchParams();
  const { bookings, getBookingById, updateBooking, cancelBooking } = useBooking();  const bookingFromContext = bookings.find(b => (b.id || b._id)?.toString() === bookingId);
  const [editError, setEditError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [form, setForm] = useState({
    pickupLocation: '',
    dropLocation: '',
    cargoType: '',
    vehicleType: '',
    description: '',
    cargoWeight: '',
    cargoSize: '',
    budget: '',
  });
  
// Driver location modal state
const [locVisible, setLocVisible] = useState(false);
const [locLoading, setLocLoading] = useState(false);
const [locError, setLocError] = useState('');
const [locData, setLocData] = useState(null); // { latitude, longitude, timestamp, speed, heading, accuracy, driver }
const [locAddress, setLocAddress] = useState('');

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

  useEffect(() => {
    if (booking) {
      setForm({
        pickupLocation: booking.fromLocation || '',
        dropLocation: booking.toLocation || '',
        cargoType: booking.loadType || '',
        vehicleType: booking.vehicleType || '',
        description: booking.description || '',
        cargoWeight: booking.cargoWeight ? String(booking.cargoWeight) : '',
        cargoSize: booking.cargoSize || '',
        budget: booking.budget ? String(booking.budget) : '',
      });
    }
  }, [booking]);

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

  const handleCancelBooking = () => {
    const statusKey = (booking?.status || '').toLowerCase();
    if (['delivered', 'completed', 'cancelled'].includes(statusKey)) {
      Alert.alert('Not allowed', 'This booking cannot be cancelled.');
      return;
    }
    Alert.alert('Cancel booking?', 'Are you sure you want to cancel this booking?', [
      { text: 'No' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            setCancelling(true);
            await cancelBooking(booking.id);
            Alert.alert('Cancelled', 'Your booking has been cancelled.');
          } catch (e) {
            Alert.alert('Error', e?.message || 'Failed to cancel booking.');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  };
  
  const handleSaveEdit = async () => {
    try {
      setUpdating(true);
      // Prepare partials only for filled fields
      const payload = {};
      if (form.pickupLocation) payload.pickupLocation = form.pickupLocation;
      if (form.dropLocation) payload.dropLocation = form.dropLocation;
      if (form.cargoType) payload.cargoType = form.cargoType;
      if (form.vehicleType) payload.vehicleType = form.vehicleType;
      if (form.description) payload.description = form.description;
      if (form.cargoWeight !== '') payload.cargoWeight = form.cargoWeight;
      if (form.cargoSize) payload.cargoSize = form.cargoSize;
      if (form.budget !== '') payload.budget = form.budget;
  
      await updateBooking(booking.id, payload);
      setEditVisible(false);
      Alert.alert('Updated', 'Your booking has been updated.');
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to update booking.');
    } finally {
      setUpdating(false);
    }
  };

  // Build Google Maps directions URL pickup -> current (optional) -> drop
const buildGoogleMapsDirUrl = (pickup, current, drop) => {
  const p = encodeURIComponent(pickup || '');
  const d = encodeURIComponent(drop || '');
  if (current?.lat && current?.lng) {
    return `https://www.google.com/maps/dir/${p}/${current.lat},${current.lng}/${d}`;
  }
  return `https://www.google.com/maps/dir/${p}/${d}`;
};

const reverseGeocode = async (lat, lng) => {
  try {
    const key = Constants?.expoConfig?.extra?.geoapifyKey || Constants?.manifest?.extra?.geoapifyKey;
    if (!key) return null;
    const url = `https://api.geoapify.com/v1/geocode/reverse?lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&apiKey=${encodeURIComponent(key)}`;
    const r = await fetch(url);
    const j = await r.json();
    return j?.features?.[0]?.properties?.formatted || null;
  } catch {
    return null;
  }
};

// Replace your existing fetchDriverLocation with this
const fetchDriverLocation = async () => {
  setLocLoading(true);
  setLocError('');
  setLocData(null);
  setLocAddress('');
  try {
    const resp = await bookingAPI.currentLocation(booking.id);
    // Axios response body or raw fetch fallback
    const body = resp?.data ?? resp;
    // Unwrap { success, data: {...} } if present
    const container = body?.data ?? body;
    // Prefer container.currentLocation, else container (for safety)
    const current = container?.currentLocation ?? container;

    const lat = current?.latitude;
    const lng = current?.longitude;

    if (typeof lat === 'number' && typeof lng === 'number') {
      const addr = await reverseGeocode(lat, lng);
      setLocAddress(addr || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setLocData(current);
    } else {
      const msg = container?.message || body?.message || 'The driver has not shared their location yet.';
      setLocError(msg);
    }
  } catch (e) {
    setLocError(e?.message || 'Failed to fetch driver location');
  } finally {
    setLocLoading(false);
  }
};

const openMaps = () => {
  const url = buildGoogleMapsDirUrl(
    booking.fromLocation,
    locData?.latitude && locData?.longitude ? { lat: locData.latitude, lng: locData.longitude } : null,
    booking.toLocation
  );
  Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to open Google Maps.'));
};

  return (
    <ScrollView
      style={styles.container}
      stickyHeaderIndices={[0]}
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <ClipboardList size={32} color="#FFFFFF" style={{alignSelf: 'center'}} />
        <Text style={styles.title}>Booking Details</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.statusSection}>
          <Text style={styles.bookingId}>Booking id: C360-PK-{booking.id}</Text>
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
              <Text style={styles.detailValue}>{humanize(booking.vehicleType)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Package size={20} color="#059669" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Cargo Type</Text>
              <Text style={styles.detailValue}>{humanize(booking.loadType)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <ContainerIcon size={20} color="aqua" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Cargo Weight (kg)</Text>
              <Text style={styles.detailValue}>{booking.cargoWeight || 'N/A'}</Text>
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
          <>
            <View style={styles.pendingInfo}>
              <Text style={styles.pendingTitle}>Looking for a driver...</Text>
              <Text style={styles.pendingText}>
                We're searching for available drivers in your area. You'll be notified once a driver accepts your request.
              </Text>
            </View>
            <View style={{ marginTop: 12, gap: 12 }}>
              <TouchableOpacity
                onPress={() => setEditVisible(true)}
                disabled={updating}
                style={{ backgroundColor: '#2563EB', opacity: updating ? 0.6 : 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {updating ? 'Updating...' : 'Edit Booking'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCancelBooking}
                disabled={cancelling}
                style={{ backgroundColor: '#DC2626', opacity: cancelling ? 0.6 : 1, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {['picked_up', 'in_transit'].includes(booking.status.toLowerCase()) && (
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => { setLocVisible(true); fetchDriverLocation(); }}
            style={{ backgroundColor: '#0EA5E9', borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>See Driver Location</Text>
          </TouchableOpacity>
        </View>
      )}
      </View>
      {/* Edit Modal */}
      <Modal visible={editVisible} transparent animationType="slide" onRequestClose={() => setEditVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Booking</Text>

            <TextInput style={styles.modalInput} placeholder="Pickup Location" value={form.pickupLocation} onChangeText={(t) => setForm((s) => ({ ...s, pickupLocation: t }))} />
            <TextInput style={styles.modalInput} placeholder="Drop Location" value={form.dropLocation} onChangeText={(t) => setForm((s) => ({ ...s, dropLocation: t }))} />
            <TextInput style={styles.modalInput} placeholder="Cargo Type" value={form.cargoType} onChangeText={(t) => setForm((s) => ({ ...s, cargoType: t }))} />
            <TextInput style={styles.modalInput} placeholder="Vehicle Type" value={form.vehicleType} onChangeText={(t) => setForm((s) => ({ ...s, vehicleType: t }))} />
            <TextInput style={[styles.modalInput, { height: 80 }]} placeholder="Description" multiline value={form.description} onChangeText={(t) => setForm((s) => ({ ...s, description: t }))} />
            <TextInput style={styles.modalInput} placeholder="Cargo Weight" keyboardType="numeric" value={form.cargoWeight} onChangeText={(t) => setForm((s) => ({ ...s, cargoWeight: t }))} />
            <TextInput style={styles.modalInput} placeholder="Cargo Size" value={form.cargoSize} onChangeText={(t) => setForm((s) => ({ ...s, cargoSize: t }))} />
            <TextInput style={styles.modalInput} placeholder="Budget" keyboardType="numeric" value={form.budget} onChangeText={(t) => setForm((s) => ({ ...s, budget: t }))} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#64748B' }]} onPress={() => setEditVisible(false)}>
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#2563EB' }]} onPress={handleSaveEdit} disabled={updating}>
                <Text style={styles.modalButtonText}>{updating ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Driver Location Modal */}
      <Modal visible={locVisible} transparent animationType="slide" onRequestClose={() => setLocVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Driver Location</Text>

            {locLoading ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <ActivityIndicator color="#2563EB" />
                <Text style={{ color: '#64748B', marginTop: 8 }}>Fetching current location…</Text>
              </View>
            ) : (
              <>
                {locError ? (
                  <Text style={{ color: '#DC2626', marginBottom: 8 }}>{locError}</Text>
                ) : (
                  <>
                    <Text style={{ color: '#1E293B', fontWeight: '600', marginBottom: 6 }}>
                      Booking #{booking.id}
                    </Text>
                    {locAddress ? (
                      <Text style={{ color: '#1E293B', marginBottom: 6 }}>Address: {locAddress}</Text>
                    ) : null}
                    {locData?.driver?.name || locData?.driver?.phone ? (
                      <Text style={{ color: '#64748B', marginBottom: 6 }}>
                        Driver: {locData?.driver?.name || 'N/A'}{locData?.driver?.phone ? ` · ${locData.driver.phone}` : ''}
                      </Text>
                    ) : null}
                    <Text style={{ color: '#64748B', marginBottom: 6 }}>
                      Last updated: {locData?.timestamp ? new Date(locData.timestamp).toLocaleString() : 'N/A'}
                    </Text>
                    {typeof locData?.speed === 'number' ? (
                      <Text style={{ color: '#64748B' }}>Speed: {locData.speed} km/h</Text>
                    ) : null}
                    {typeof locData?.heading === 'number' ? (
                      <Text style={{ color: '#64748B' }}>Heading: {locData.heading}°</Text>
                    ) : null}
                    {typeof locData?.accuracy === 'number' ? (
                      <Text style={{ color: '#64748B' }}>Accuracy: {locData.accuracy} m</Text>
                    ) : null}
                  </>
                )}

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#0EA5E9' }]} onPress={fetchDriverLocation}>
                    <Text style={styles.modalButtonText}>Refresh Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#059669' }]} onPress={openMaps}>
                    <Text style={styles.modalButtonText}>See on Maps</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.modalButton, { backgroundColor: '#64748B', marginTop: 12 }]} onPress={() => setLocVisible(false)}>
                  <Text style={styles.modalButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 24,
    backgroundColor: '#024d9a',
    color: '#FFFFFF',
    gap: 16,
    marginBottom: 24,
    zIndex: 10,
    elevation: 4,               // Android
    shadowColor: '#000',        // iOS
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    height: 180,
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});