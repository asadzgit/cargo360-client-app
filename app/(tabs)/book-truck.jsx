import { useState } from 'react';
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
  const [loadType, setLoadType] = useState('');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const { addBooking } = useBooking();

  const handleSubmit = async () => {
    if (!vehicleType || !loadType || !fromLocation || !toLocation) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const booking = await addBooking({
        vehicleType,
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
      <View style={styles.header}>
        <Truck size={32} color="#2563EB" />
        <Text style={styles.title}>Book a Vehicle</Text>
        <Text style={styles.subtitle}>Fill out the details for your booking request</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Vehicle Type *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsContainer}>
            {vehicleTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.optionButton,
                  vehicleType === type && styles.optionButtonSelected
                ]}
                onPress={() => setVehicleType(type)}
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

        <View style={styles.section}>
          <Text style={styles.label}>From Location *</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter pickup location"
              value={fromLocation}
              onChangeText={setFromLocation}
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>To Location *</Text>
          <View style={styles.inputContainer}>
            <MapPin size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter delivery location"
              value={toLocation}
              onChangeText={setToLocation}
              placeholderTextColor="#94A3B8"
            />
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  form: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
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
});