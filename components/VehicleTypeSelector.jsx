import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Truck, X } from 'lucide-react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

/**
 * VehicleTypeSelector Component for React Native
 * 
 * Full-screen modal that shows vehicle options based on selected category
 * Similar to the web portal's VehicleTypeSelector
 * 
 * Props:
 * @param {Boolean} isOpen - Whether selector is open
 * @param {Function} onClose - Callback when closed
 * @param {Function} onSelect - Callback when vehicle is selected (receives vehicle object)
 * @param {String} category - Selected category name (Mazda, Truck, Trailer, etc.)
 */
const VehicleTypeSelector = ({
  isOpen,
  onClose,
  onSelect,
  category = ''
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Vehicle data structure (same as web portal)
  const vehicleData = {
    Suzuki: [
      { id: 'suzuki_vehicle', name: 'Suzuki', capacity: '50.0 kg – 800 kg' },
    ],
    Shehzore: [
      { id: 'shehzore_vehicle', name: 'Shehzore', capacity: '100.0 kg – 2.2 tons' },
    ],
    Mazda: [
      { id: 'mazda_mini_12_open', name: 'Mazda Mini 12\' Open', capacity: '500.0 kg – 5.0 tons' },
      { id: 'mazda_mini_14_open', name: 'Mazda Mini 14\' Open', capacity: '500.0 kg – 8.0 tons' },
      { id: 'mazda_mini_16_open', name: 'Mazda Mini 16\' Open', capacity: '500.0 kg – 8.0 tons' },
      { id: 'mazda_t3500_17_open', name: 'Mazda T3500 17\' Open', capacity: '500.0 kg – 8.0 tons' },
      { id: 'mazda_t3500_18_open', name: 'Mazda T3500 18\' Open', capacity: '500.0 kg – 8.0 tons' },
      { id: 'mazda_long_22_open', name: 'Mazda LONG 22\' Open', capacity: '500.0 kg – 6.0 tons' },
      { id: 'mazda_mini_16_container', name: 'Mazda Mini 16\' Container', capacity: '500.0 kg – 6.0 tons' },
      { id: 'mazda_t3500_17_container', name: 'Mazda T3500 17\' Container', capacity: '500.0 kg – 6.0 tons' },
      { id: 'mazda_t3500_18_container', name: 'Mazda T3500 18\' Container', capacity: '500.0 kg – 6.0 tons' },
      { id: 'mazda_t3500_20_container', name: 'Mazda T3500 20\' Container', capacity: '500.0 kg – 6.0 tons' },
      { id: 'mazda_long_22_container', name: 'Mazda LONG 22\' Container', capacity: '500.0 kg – 3.5 tons' },
      { id: 'mazda_long_24_container', name: 'Mazda LONG 24\' Container', capacity: '500.0 kg – 3.5 tons' },
      { id: 'mazda_long_26_container', name: 'Mazda LONG 26\' Container', capacity: '500.0 kg – 3.5 tons' },
      { id: 'mazda_long_32_container', name: 'Mazda LONG 32\' Container', capacity: '500.0 kg – 3.5 tons' },
      { id: 'mazda_long_34_container', name: 'Mazda LONG 34\' Container', capacity: '500.0 kg – 3.5 tons' },
    ],
    Truck: [
      { id: 'truck_6_wheeler_high_wall', name: 'Truck 6-Wheeler High wall', capacity: '4.0 tons – 12.0 tons' },
      { id: 'truck_6_wheeler_fb_hino', name: 'Truck 6-Wheeler FB Hino', capacity: '4.0 tons – 15.0 tons' },
      { id: 'truck_10_wheeler_high_wall', name: 'Truck 10-Wheeler High wall', capacity: '8.0 tons – 25.0 tons' },
    ],
    Trailer: [
      { id: 'trailer_20_feet', name: 'Trailer 20 Feet', capacity: '4.0 tons – 2.5 tons' },
      { id: 'trailer_30_feet', name: 'Trailer 30 feet', capacity: '6.0 tons – 30.0 tons' },
      { id: 'trailer_40_feet', name: 'Trailer 40 feet', capacity: '8.0 tons – 50.0 tons' },
      { id: 'trailer_42_feet', name: 'Trailer 42 feet', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_45_feet', name: 'Trailer 45 feet', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_20_feet_containerized', name: 'Trailer 20 feet Containerized', capacity: '3.0 tons – 25.0 tons' },
      { id: 'trailer_40_feet_containerized', name: 'Trailer 40 feet Containerized', capacity: '3.0 tons – 50.0 tons' },
      { id: 'trailer_44_feet_containerized', name: 'Trailer 44 feet Containerized', capacity: '8.0 tons – 45.0 tons' },
      { id: 'trailer_45_feet_containerized', name: 'Trailer 45 feet Containerized', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_50_feet_containerized', name: 'Trailer 50 feet containerized', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_16_feet_reefer_containerized', name: 'Trailer 16 feet Reefer Containerized', capacity: '' },
      { id: 'trailer_18_feet_reefer_containerized', name: 'Trailer 18 feet Reefer Containerized', capacity: '2.0 tons – 6.0 tons' },
      { id: 'trailer_20_feet_reefer_containerized', name: 'Trailer 20 feet Reefer Containerized', capacity: '5.0 tons – 2.5.0 tons' },
      { id: 'trailer_21_feet_reefer_containerized', name: 'Trailer 21 feet Reefer Containerized', capacity: '3.0 tons – 15.0 tons' },
      { id: 'trailer_40_feet_reefer_containerized', name: 'Trailer 40 feet Reefer Containerized', capacity: '8.0 tons – 40.0 tons' },
      { id: 'trailer_30_feet_low_bed', name: 'Trailer 30 feet Low Bed', capacity: '10.0 tons – 30.0 tons' },
      { id: 'trailer_40_feet_low_bed', name: 'Trailer 40 feet Low Bed', capacity: '20.0 tons – 60.0 tons' },
      { id: 'trailer_50_feet_semi_low_bed', name: 'Trailer 50 feet Semi Low Bed', capacity: '50.0 tons – 120.0 tons' },
      { id: 'trailer_52_low_bed', name: 'Trailer 52 Low Bed', capacity: '5.0 tons – 65.0 tons' },
      { id: 'trailer_55_feet_semi_low_bed', name: 'Trailer 55 feet Semi Low Bed', capacity: '50.0 tons – 120.0 tons' },
      { id: 'trailer_60_feet_semi_low_bed', name: 'Trailer 60 feet Semi Low Bed', capacity: '50.0 tons – 120.0 tons' },
      { id: 'trailer_70_feet_low_bed', name: 'Trailer 70 feet Low Bed', capacity: '5.0 tons – 85.0 tons' },
      { id: 'trailer_20_feet_flat_bed', name: 'Trailer 20 feet Flat Bed', capacity: '4.0 tons – 25.0 tons' },
      { id: 'trailer_40_feet_flat_bed', name: 'Trailer 40 feet Flat Bed', capacity: '3.0 tons – 50.0 tons' },
      { id: 'trailer_42_feet_flat_bed', name: 'Trailer 42 feet Flat Bed', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_52_feet_flat_bed', name: 'Trailer 52 feet Flat Bed', capacity: '10.0 tons – 50.0 tons' },
      { id: 'trailer_40_feet_half_body', name: 'Trailer 40 feet Half Body', capacity: '10.0 tons – 35.0 tons' },
      { id: 'trailer_42_feet_half_body', name: 'Trailer 42 feet Half Body', capacity: '10.0 tons – 35.0 tons' },
      { id: 'trailer_48_feet_half_body', name: 'Trailer 48 feet Half Body', capacity: '10.0 tons – 35.0 tons' },
      { id: 'trailer_50_feet_half_body', name: 'Trailer 50 feet Half Body', capacity: '10.0 tons – 35.0 tons' },
    ],
  };

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedVehicle(null);
    }
  }, [isOpen]);

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const handleConfirm = () => {
    if (selectedVehicle) {
      onSelect(selectedVehicle);
      onClose();
    }
  };

  if (!isOpen) return null;

  const vehicles = vehicleData[category] || [];

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Truck size={24} color="#FFFFFF" />
              <Text style={[styles.headerTitle, { marginLeft: 12 }]}>Select {category} Vehicle</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Vehicle List */}
          <ScrollView style={styles.vehicleList} showsVerticalScrollIndicator={false}>
          {vehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No vehicles available for {category}</Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={[
                  styles.vehicleItem,
                  selectedVehicle?.id === vehicle.id && styles.vehicleItemSelected
                ]}
                onPress={() => handleVehicleSelect(vehicle)}
              >
                <View style={styles.vehicleItemContent}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  {vehicle.capacity && (
                    <Text style={styles.vehicleCapacity}>
                      <Text style={styles.capacityLabel}>Capacity: </Text>
                      {vehicle.capacity}
                    </Text>
                  )}
                </View>
                {selectedVehicle?.id === vehicle.id && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {selectedVehicle && (
            <View style={styles.selectedPreview}>
              <Truck size={20} color="#01304e" />
              <Text style={[styles.selectedText, { marginLeft: 8 }]}>{selectedVehicle.name}</Text>
            </View>
          )}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.confirmButton,
                !selectedVehicle && styles.confirmButtonDisabled
              ]}
              onPress={handleConfirm}
              disabled={!selectedVehicle}
            >
              <Text style={styles.confirmButtonText}>Select Vehicle</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    height: MODAL_HEIGHT,
    backgroundColor: '#F8FAFC',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#01304e',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  vehicleList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  vehicleItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  vehicleItemSelected: {
    borderColor: '#01304e',
    backgroundColor: '#F0F9FF',
  },
  vehicleItemContent: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 6,
  },
  vehicleCapacity: {
    fontSize: 14,
    color: '#64748B',
  },
  capacityLabel: {
    fontWeight: '600',
    color: '#475569',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#01304e',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#01304e',
  },
  selectedText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#01304e',
  },
  footerActions: {
    flexDirection: 'row',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#01304e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginLeft: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default VehicleTypeSelector;

