import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system"; // ✅ for Base64 encoding
import FileUpload from "./FileUpload"; 

// ✅ helper function
const uriToBase64 = async (file) => {
  if (!file?.uri) return null;
  try {
    const base64 = await FileSystem.readAsStringAsync(file.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return {
      name: file.name || file.uri.split("/").pop(),
      size: file.size || 0,
      base64,
    };
  } catch (err) {
    console.error("Base64 conversion failed:", err);
    return null;
  }
};

export default function ExportsForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    city: "LHR",
    transportMode: "air",
    containerType: "LCL",
    files: {},
  });

  const [errors, setErrors] = useState({});
  const [uploadMessages, setUploadMessages] = useState({});

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

  // ✅ Updated handleSubmit to convert + send data
  const handleSubmit = async () => {
    const newErrors = {};
    requiredFields.forEach((field) => {
      if (!formData.files[field] || formData.files[field] === "") {
        newErrors[field] = `${getLabel(field)} is required`;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // Convert files to base64
      const encodedFiles = {};
      for (const [key, file] of Object.entries(formData.files)) {
        if (file && file.uri) {
          const converted = await uriToBase64(file);
          if (converted) encodedFiles[key] = converted;
        }
      }

      // Prepare payload
      const payload = {
        city: formData.city,
        transportMode: formData.transportMode,
        containerType: formData.containerType,
        files: encodedFiles,
      };

      // Send to backend
      const response = await fetch("http://localhost:3000/api/exports/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        Alert.alert("Error", "Failed to submit Export Documentation.");
        return;
      }

      const result = await response.json();
      console.log("Upload result:", result);
      Alert.alert("Success", "Export Documentation submitted successfully ✅");

      onSubmit?.(payload);
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "An error occurred while uploading.");
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
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit Export Documentation</Text>
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
  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 15,
  },
});
