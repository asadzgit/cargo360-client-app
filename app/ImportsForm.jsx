import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as FileSystem from 'expo-file-system'; // ✅ added for base64 conversion
import FileUpload from './FileUpload';

// ✅ helper to convert file uri → base64
const uriToBase64 = async (file) => {
  if (!file?.uri) return null;
  try {
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      name: file.name || (file.uri.split('/').pop() || 'file'),
      size: file.size || 0,
      base64,
    };
  } catch (err) {
    console.error('Base64 conversion failed', err);
    return null;
  }
};

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

  // ✅ updated submit with base64 conversion + API call
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

    try {
      // ✅ Convert all selected files to base64
      const fileEntries = Object.entries(formData.files);
      const encodedFiles = {};

      for (const [key, file] of fileEntries) {
        if (!file || !file.uri) continue;
        const converted = await uriToBase64(file);
        if (converted) {
          encodedFiles[key] = converted;
        }
      }

      // ✅ Create payload
      const payload = {
        city: formData.city,
        transportMode: formData.transportMode,
        containerType: formData.containerType,
        port: formData.port,
        files: encodedFiles,
      };

      // ✅ Send to backend
      const res = await fetch('http://localhost:3000/api/imports/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Upload failed:', text);
        Alert.alert('Error', 'Server error occurred.');
        return;
      }

      const result = await res.json();
      console.log('Server response:', result);

      Alert.alert('Success', 'Import Documentation submitted successfully');
      onSubmit?.(payload); // optional callback
    } catch (error) {
      console.error('Submit error:', error);
      Alert.alert('Error', 'Failed to upload files');
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
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Import Documentation</Text>
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
  submitText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 15 },
});
