import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import FileUpload from './FileUpload';
import { uploadDocument, DOCUMENT_TYPE_MAP } from '../utils/documentUpload';
import { clearanceAPI } from '../services/api';

export default function ImportsForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    city: 'LHR',
    transportMode: 'air',
    containerType: 'LCL',
    port: '',
    files: {},
  });

  const [errors, setErrors] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ Updated submit with new API sequence: upload documents -> create clearance request
  const handleSubmit = async () => {
    const newErrors = {};

    if (!formData.files.commonInvoices)
      newErrors.commonInvoices = 'Commercial Invoices is required';
    if (!formData.files.packingLists)
      newErrors.packingLists = 'Packing Lists is required';
    if (!formData.files.billOfLading)
      newErrors.billOfLading = 'Bill Of Lading is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      // Step 1: Upload all files using the new sequence (signature -> Cloudinary -> save metadata)
      const documentUploads = [];
      const fileEntries = Object.entries(formData.files);

      for (const [key, file] of fileEntries) {
        if (!file || !file.uri) continue;
        
        const documentType = DOCUMENT_TYPE_MAP[key];
        if (!documentType) {
          console.warn(`Unknown document type for key: ${key}`);
          continue;
        }

        try {
          const document = await uploadDocument(file, documentType);
          documentUploads.push(document);
        } catch (error) {
          console.error(`Failed to upload ${key}:`, error);
          Alert.alert('Error', `Failed to upload ${key}. Please try again.`);
          setSubmitting(false);
          return;
        }
      }

      // Step 2: Create clearance request with uploaded document IDs
      const documentIds = documentUploads.map(doc => doc.id);

      // Map transport mode: 'air' -> 'air_only' for LHR, keep as is for KHI
      const transportMode = formData.city === 'LHR' ? 'air_only' : formData.transportMode;

      const requestPayload = {
        requestType: 'import',
        city: formData.city,
        transportMode: transportMode,
        containerType: formData.containerType,
        port: formData.port || null,
        pol: null,
        pod: null,
        product: null,
        incoterms: null,
        shipmentId: null,
        documentIds: documentIds,
      };

      const requestResponse = await clearanceAPI.create(requestPayload);
      const request = requestResponse.data?.data?.request || requestResponse.data?.request || requestResponse.data;

      Alert.alert('Success', 'Import clearance request created successfully!');
      onSubmit?.(request); // Pass the created request to callback
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', error?.message || 'Failed to create clearance request');
    } finally {
      setSubmitting(false);
    }
  };

  // ✅ updated handleFileChange
  const handleFileChange = (fileType, file) => {
    setFormData((prev) => ({
      ...prev,
      files: { ...prev.files, [fileType]: file },
    }));

    if (!file) {
      const newSuccess = { ...uploadSuccess };
      delete newSuccess[fileType];
      setUploadSuccess(newSuccess);
      return;
    }

    setUploadSuccess((prev) => ({
      ...prev,
      [fileType]: 'File uploaded successfully ✅',
    }));

    const newErrors = { ...errors };
    delete newErrors[fileType];
    setErrors(newErrors);
  };

  const handleCityChange = (city) => {
    setFormData((prev) => ({
      ...prev,
      city,
      containerType: city === 'LHR' ? 'LCL' : prev.containerType,
      transportMode: city === 'LHR' ? 'air' : prev.transportMode,
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Import Documentation</Text>

        {/* City Selection */}
        <Text style={styles.label}>Select City</Text>
        <View style={styles.cityToggleContainer}>
          {['LHR', 'KHI'].map((city) => (
            <TouchableOpacity
              key={city}
              style={[styles.cityBtn, formData.city === city && styles.activeBtn]}
              onPress={() => handleCityChange(city)}
            >
              <Text
                style={[styles.cityText, formData.city === city && styles.activeText]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transport Mode */}
        <Text style={styles.label}>Transport Mode</Text>
        {formData.city === 'LHR' ? (
          <View style={styles.radioRow}>
            <View style={[styles.radioCircle, styles.radioCircleSelected]}>
              <View style={styles.radioInnerDot} />
            </View>
            <Text style={styles.radioLabel}>By Air only</Text>
          </View>
        ) : (
          <View>
            {['air', 'sea'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.radioRow}
                onPress={() => setFormData((p) => ({ ...p, transportMode: mode }))}
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.transportMode === mode && styles.radioCircleSelected,
                  ]}
                >
                  {formData.transportMode === mode && (
                    <View style={styles.radioInnerDot} />
                  )}
                </View>
                <Text style={styles.radioLabel}>
                  {mode === 'air' ? 'By Air' : 'By Sea'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Container Type */}
        <Text style={styles.label}>Container Type</Text>
        <View style={styles.cityToggleContainer}>
          {['LCL', 'FCL'].map((type) => (
            <TouchableOpacity
              key={type}
              disabled={type === 'FCL' && formData.city === 'LHR'}
              style={[
                styles.cityBtn,
                formData.containerType === type && styles.activeBtn,
                type === 'FCL' && formData.city === 'LHR' && { opacity: 0.5 },
              ]}
              onPress={() =>
                setFormData((prev) => ({ ...prev, containerType: type }))
              }
            >
              <Text
                style={[
                  styles.cityText,
                  formData.containerType === type && styles.activeText,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Port Selection */}
        {formData.city === 'KHI' && (
          <>
            <Text style={styles.label}>Select Port / Airport</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.port}
                onValueChange={(value) => setFormData((p) => ({ ...p, port: value }))}
                style={styles.picker}
              >
                <Picker.Item label="Select a Port/Airport" value="" color="#94A3B8" />
                <Picker.Item label="KGT/PICT" value="KGT/PICT" />
                <Picker.Item label="KICT" value="KICT" />
                <Picker.Item label="Port Qasim" value="Port Qasim" />
                <Picker.Item label="NLC" value="NLC" />
                <Picker.Item label="Burwa Oil" value="Burwa Oil" />
                <Picker.Item label="Al Hamad" value="Al Hamad" />
                <Picker.Item label="Pak Scaleen" value="Pak Scaleen" />
                <Picker.Item label="ODT" value="ODT" />
                <Picker.Item label="Airport" value="Airport" />
              </Picker>
            </View>
          </>
        )}

        {/* File Uploads */}
        <Text style={styles.subTitle}>Required Documents</Text>
        {[
          { key: 'commonInvoices', label: 'Commercial Invoices', required: true },
          { key: 'packingLists', label: 'Packing Lists', required: true },
          { key: 'billOfLading', label: 'Bill Of Lading', required: true },
          { key: 'insurance', label: 'Insurance' },
          { key: 'others', label: 'Others' },
        ].map(({ key, label, required }) => (
          <View key={key} style={{ marginBottom: 14 }}>
            <FileUpload
              required={required}
              label={label}
              onChange={(file) => handleFileChange(key, file)}
              selectedFile={formData.files[key]}
            />
            {errors[key] && <Text style={styles.errorText}>{errors[key]}</Text>}
            {uploadSuccess[key] && (
              <Text style={styles.successText}>{uploadSuccess[key]}</Text>
            )}
          </View>
        ))}

        {/* Submit */}
        <TouchableOpacity 
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit Import Documentation</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// 💅 Styles remain unchanged
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginVertical: 12 },
  cityToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    padding: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  cityBtn: {
    borderRadius: 8,
    paddingVertical: 13,
    paddingHorizontal: 29,
  },
  cityText: { color: '#334155', fontWeight: '700' },
  activeBtn: { backgroundColor: '#fff' },
  activeText: { color: '#0F172A', fontWeight: '700' },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 45,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  picker: { color: '#0F172A' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 7 },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  radioCircleSelected: { borderColor: '#334155', borderWidth: 2 },
  radioInnerDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: '#334155' },
  radioLabel: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  errorText: { color: 'red', fontSize: 13, marginTop: 4 },
  successText: { color: 'green', fontSize: 13, marginTop: 4 },
  submitBtn: { backgroundColor: '#2563EB', paddingVertical: 12, borderRadius: 10, marginTop: 12 },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
});
