import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import FileUpload from "./FileUpload";
import { uploadDocument, DOCUMENT_TYPE_MAP } from '../utils/documentUpload';
import { clearanceAPI } from '../services/api';

export default function ExportsForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    city: "LHR",
    transportMode: "air",
    containerType: "LCL",
    files: {},
  });

  const [errors, setErrors] = useState({});
  const [uploadMessages, setUploadMessages] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const requiredFields = [
    "pol",
    "pod",
    "product",
    "incoTerms",
    "commercialInvoices",
    "packingLists",
  ];

  const getLabel = (docType) => {
    const labels = {
      pol: "Port of Loading",
      pod: "Port of Discharge",
      product: "Product/Items",
      incoTerms: "Incoterms",
      commercialInvoices: "Commercial Invoices",
      packingLists: "Packing Lists",
      insurance: "Insurance",
      others: "Others",
    };
    return labels[docType] || docType;
  };

  // ✅ Updated handleSubmit with new API sequence: upload documents -> create clearance request
  const handleSubmit = async () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData.files[field] || formData.files[field] === "") {
        newErrors[field] = `${getLabel(field)} is required`;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      // Step 1: Upload all files using the new sequence (signature -> Cloudinary -> save metadata)
      const documentUploads = [];
      const fileEntries = Object.entries(formData.files);

      for (const [key, file] of fileEntries) {
        // Skip text fields (pol, pod, product, incoTerms)
        if (isTextField(key)) continue;
        
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
          Alert.alert("Error", `Failed to upload ${key}. Please try again.`);
          setSubmitting(false);
          return;
        }
      }

      // Step 2: Create clearance request with uploaded document IDs and text fields
      const documentIds = documentUploads.map(doc => doc.id);

      // Map transport mode: 'air' -> 'air_only' for LHR, keep as is for KHI
      const transportMode = formData.city === 'LHR' ? 'air_only' : formData.transportMode;

      const requestPayload = {
        requestType: 'export',
        city: formData.city,
        transportMode: transportMode,
        containerType: formData.containerType,
        port: null,
        pol: formData.files.pol || null,
        pod: formData.files.pod || null,
        product: formData.files.product || null,
        incoterms: formData.files.incoTerms || null,
        shipmentId: null,
        documentIds: documentIds,
      };

      const requestResponse = await clearanceAPI.create(requestPayload);
      const request = requestResponse.data?.data?.request || requestResponse.data?.request || requestResponse.data;

      Alert.alert("Success", "Export clearance request created successfully!");
      onSubmit?.(request);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", error?.message || "An error occurred while creating clearance request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (fileType, file) => {
    setFormData((prev) => ({
      ...prev,
      files: { ...prev.files, [fileType]: file },
    }));

    if (file) {
      setUploadMessages((prev) => ({
        ...prev,
        [fileType]: "File uploaded successfully ✅",
      }));
    }
  };

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      files: { ...prev.files, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const isTextField = (docType) =>
    ["pol", "pod", "product", "incoTerms"].includes(docType);

  const documentList = [
    "pol",
    "pod",
    "product",
    "incoTerms",
    "commercialInvoices",
    "packingLists",
    "insurance",
    "others",
  ];

  const requiredFieldsSet = new Set(requiredFields);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        <Text style={styles.title}>Export Documentation</Text>

        {/* City Selection */}
        <Text style={styles.label}>Select City</Text>
        <View style={styles.cityToggleContainer}>
          {["LHR", "KHI"].map((city) => (
            <TouchableOpacity
              key={city}
              style={[
                styles.cityBtn,
                formData.city === city && styles.activeBtn,
              ]}
              onPress={() =>
                setFormData((prev) => ({
                  ...prev,
                  city,
                  containerType:
                    city === "LHR" ? "LCL" : prev.containerType,
                  transportMode:
                    city === "LHR" ? "air" : prev.transportMode,
                }))
              }
            >
              <Text
                style={[
                  styles.cityText,
                  formData.city === city && styles.activeText,
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Transport Mode */}
        <Text style={styles.label}>Transport Mode</Text>
        {formData.city === "LHR" ? (
          <View style={styles.radioRow}>
            <View style={[styles.radioCircle, styles.radioCircleSelected]}>
              <View style={styles.radioInnerDot} />
            </View>
            <Text style={styles.radioLabel}>By Air only</Text>
          </View>
        ) : (
          <View>
            {["air", "sea"].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={styles.radioRow}
                onPress={() =>
                  setFormData((p) => ({ ...p, transportMode: mode }))
                }
              >
                <View
                  style={[
                    styles.radioCircle,
                    formData.transportMode === mode &&
                      styles.radioCircleSelected,
                  ]}
                >
                  {formData.transportMode === mode && (
                    <View style={styles.radioInnerDot} />
                  )}
                </View>
                <Text style={styles.radioLabel}>
                  {mode === "air" ? "By Air" : "By Sea"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Container Type */}
        <Text style={styles.label}>Container Type</Text>
        <View style={styles.cityToggleContainer}>
          {["LCL", "FCL"].map((type) => (
            <TouchableOpacity
              key={type}
              disabled={type === "FCL" && formData.city === "LHR"}
              style={[
                styles.cityBtn,
                formData.containerType === type && styles.activeBtn,
                type === "FCL" && formData.city === "LHR" && { opacity: 0.5 },
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

        {/* Required Documents */}
        <Text style={styles.subTitle}>Required Documents</Text>
        {documentList.map((docType) => (
          <View key={docType} style={{ marginBottom: 14 }}>
            {isTextField(docType) ? (
              <>
                <Text style={styles.label}>
                  {getLabel(docType)}
                  {requiredFieldsSet.has(docType) && (
                    <Text style={{ color: "red" }}> *</Text>
                  )}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder={
                    docType === "incoTerms"
                      ? "e.g: FOB, CFR, Ex-Works, etc"
                      : `Enter ${getLabel(docType)}`
                  }
                  placeholderTextColor="#94A3B8"
                  value={formData.files[docType] || ""}
                  onChangeText={(text) =>
                    handleTextChange(docType, text)
                  }
                />
              </>
            ) : (
              <FileUpload
                required={requiredFieldsSet.has(docType)}
                label={getLabel(docType)}
                onChange={(file) => handleFileChange(docType, file)}
                selectedFile={formData.files[docType]}
              />
            )}

            {uploadMessages[docType] && (
              <Text style={styles.successText}>{uploadMessages[docType]}</Text>
            )}
            {errors[docType] && (
              <Text style={styles.errorText}>{errors[docType]}</Text>
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
            <Text style={styles.submitText}>Submit Export Documentation</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", marginVertical: 8 },
  subTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginVertical: 12 },
  cityToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#e2e8f0",
    padding: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 10,
    gap: 6,
  },
  cityBtn: { borderRadius: 8, paddingVertical: 13, paddingHorizontal: 29 },
  cityText: { color: "#334155", fontWeight: "700" },
  activeBtn: { backgroundColor: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    color: "#0F172A",
  },
  radioRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 7,
  },
  radioCircleSelected: { borderColor: "#334155", borderWidth: 2 },
  radioInnerDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: "#334155" },
  radioLabel: { fontSize: 15, color: "#0F172A", fontWeight: "500" },
  errorText: { color: "red", fontSize: 13, marginTop: 4 },
  successText: { color: "green", fontSize: 13, marginTop: 4 },
  submitBtn: {
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
});
