import { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Package, MapPin, ArrowRight } from 'lucide-react-native';
import { useBooking } from '../../context/BookingContext';

const vehicleTypes = [
  'Small Truck (1-2 Tons)',
  'Medium Truck (3-5 Tons)', 
  'Large Truck (6-10 Tons)',
  'Heavy Truck (10+ Tons)'
];

const loadTypes = [
  'General Cargo',
  'Fragile Items',
  'Perishable Goods',
  'Heavy Machinery',
  'Construction Materials',
  'Furniture'
];

export default function BookTruckScreen() {
  const [vehicleType, setVehicleType] = useState('');
  const [customVehicleType, setCustomVehicleType] = useState('');
  const [loadType, setLoadType] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [pickupOptions, setPickupOptions] = useState([]);
  const [dropOptions, setDropOptions] = useState([]);
  const [pickupLoading, setPickupLoading] = useState(false);
  const [dropLoading, setDropLoading] = useState(false);
  const pickupDebounceRef = useRef(null);
  const dropDebounceRef = useRef(null);

  const router = useRouter();
  const { addBooking } = useBooking();

  // Debounced fetch for Nominatim (OpenStreetMap)
  const fetchLocations = async (query, setOpts, setLoad) => {
    if (!query || query.trim().length < 3) {
      setOpts([]);
      return;
    }
    setLoad(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=pk&limit=10&addressdetails=1`;
      const resp = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      const data = await resp.json();
      const opts = (Array.isArray(data) ? data : []).map((item) => ({
        id: `${item.place_id}`,
        label: item.display_name,
        value: item.display_name,
        lat: item.lat,
        lon: item.lon,
      }));
      setOpts(opts);
    } catch (_e) {
      setOpts([]);
    } finally {
      setLoad(false);
    }
  };

  const handlePickupChange = (text) => {
    setFromLocation(text);
    if (pickupDebounceRef.current) clearTimeout(pickupDebounceRef.current);
    pickupDebounceRef.current = setTimeout(() => {
      fetchLocations(text, setPickupOptions, setPickupLoading);
    }, 300);
  };

  const handleDropChange = (text) => {
    setToLocation(text);
    if (dropDebounceRef.current) clearTimeout(dropDebounceRef.current);
    dropDebounceRef.current = setTimeout(() => {
      fetchLocations(text, setDropOptions, setDropLoading);
    }, 300);
  };

  const handleSubmit = async () => {
    const finalVehicleType = vehicleType === 'Other (please specify)' ? customVehicleType.trim() : vehicleType;

    if (!finalVehicleType || !loadType || !fromLocation || !toLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (vehicleType === 'Other (please specify)' && finalVehicleType.length < 5) {
      Alert.alert('Error', 'Please specify a vehicle type (min 5 characters).');
      return;
    }

    setLoading(true);

    try {
      const booking = await addBooking({
        vehicleType: finalVehicleType,
        loadType,
        fromLocation,
        toLocation,
        description,
      });

      Alert.alert(
        'Booking Confirmed!', 
        `Your booking request (#${booking?.id || booking?._id || 'N/A'}) has been submitted successfully. You will be notified when a driver accepts your request.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form
              setVehicleType('');
              setLoadType('');
              setFromLocation('');
              setToLocation('');
              setDescription('');
              setPickupOptions([]);
              setDropOptions([]);
              // Navigate to home
              router.push('/(tabs)');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={{
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 32,
        backgroundColor: '#024d9a',
        borderBottomLeftRadius: 60,
        borderBottomRightRadius: 60,
      }}>
        <Truck size={32} color="#FFFFFF" />
        <Text style={styles.title}>Book a Vehicle</Text>
        <Text style={styles.subtitle}>Fill out the details for your booking request</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Vehicle Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
            {[...vehicleTypes, 'Other (please specify)'].map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  vehicleType === type && styles.optionButtonSelected
                ]}
                onPress={() => {
                  setVehicleType(type);
                  if (type !== 'Other (please specify)') setCustomVehicleType('');
                }}
              >
                <Text style={[
                  styles.optionText,
                  vehicleType === type && styles.optionTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {vehicleType === 'Other (please specify)' && (
            <View style={[styles.inputContainer, { marginTop: 8 }]}>
              <TextInput
                style={styles.input}
                placeholder="Other vehicle type (min 5 characters)"
                value={customVehicleType}
                onChangeText={setCustomVehicleType}
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Load Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
            {loadTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  loadType === type && styles.optionButtonSelected
                ]}
                onPress={() => setLoadType(type)}
              >
                <Text style={[
                  styles.optionText,
                  loadType === type && styles.optionTextSelected
                ]}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

          {/* new from location inputs */}
          <View style={[styles.section, { zIndex: 200, elevation: 3 }]}>
            <Text style={styles.label}>From Location *</Text>
            <View style={{ position: 'relative' }}>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search for pickup location..."
                  value={fromLocation}
                  onChangeText={handlePickupChange}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {(pickupLoading || pickupOptions.length > 0) && (
                <View style={styles.dropdown}>
                  {pickupLoading ? (
                    <Text style={styles.dropdownHint}>Searching locations...</Text>
                  ) : (
                    <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {pickupOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setFromLocation(opt.value);
                            setPickupOptions([]);
                          }}
                        >
                          <Text style={styles.dropdownText}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  {!pickupLoading && pickupOptions.length === 0
                    && fromLocation.trim().length > 0 && fromLocation.trim().length < 3 && (
                    <Text style={styles.dropdownHint}>Type at least 3 characters to search...</Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* new TO location inputs */}
          <View style={[styles.section, { zIndex: 100, elevation: 2 }]}>
            <Text style={styles.label}>To Location *</Text>
            <View style={{ position: 'relative' }}>
              <View style={styles.inputContainer}>
                <MapPin size={20} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Search for delivery location..."
                  value={toLocation}
                  onChangeText={handleDropChange}
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {(dropLoading || dropOptions.length > 0) && (
                <View style={styles.dropdown}>
                  {dropLoading ? (
                    <Text style={styles.dropdownHint}>Searching locations...</Text>
                  ) : (
                    <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {dropOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setToLocation(opt.value);
                            setDropOptions([]);
                          }}
                        >
                          <Text style={styles.dropdownText}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  {!dropLoading && dropOptions.length === 0
                    && toLocation.trim().length > 0 && toLocation.trim().length < 3 && (
                    <Text style={styles.dropdownHint}>Type at least 3 characters to search...</Text>
                  )}
                </View>
              )}
            </View>
          </View>

        <View style={styles.section}>
          <Text style={styles.label}>Additional Details</Text>
          <View style={styles.inputContainer}>
            <Package size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any special requirements or instructions..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.routePreview}>
          <View style={styles.routeInfo}>
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <Text style={styles.routeText}>{fromLocation || 'Pickup Location'}</Text>
            </View>
            <ArrowRight size={16} color="#64748B" style={styles.routeArrow} />
            <View style={styles.routePoint}>
              <View style={styles.routeDot} />
              <Text style={styles.routeText}>{toLocation || 'Delivery Location'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting Request...' : 'Submit Booking Request'}
          </Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 32,
    backgroundColor: '#024d9a',
    borderRadius: '0px 0px 60px 60px',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    marginTop: 10,
  },
  section: {
    marginBottom: 24,
    position: 'relative',
    zIndex: 0,
    overflow: 'visible',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  optionButtonSelected: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  optionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: '#FFFFFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
    marginTop: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 80,
  },
  routePreview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routePoint: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginRight: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
  },
  routeArrow: {
    marginHorizontal: 16,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    marginTop: 10,
    overflow: 'visible',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
  },
  dropdownHint: {
    padding: 10,
    fontSize: 12,
    color: '#64748B',
  },
});