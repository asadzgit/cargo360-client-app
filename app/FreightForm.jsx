import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system"; // ✅ for Base64
import { Picker } from "@react-native-picker/picker";
import { Upload } from "lucide-react-native";

export default function FreightForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    tradeType: "Import",
    containerType: "LCL",
    fields: {},
  });

  const [errors, setErrors] = useState({});
  const [uploadMessages, setUploadMessages] = useState({});

  // ✅ helper: convert file to base64
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

  const getLabel = (docType) => {
    const labels = {
      cbm: "CBM",
      pkgs: "Packages",
      pol: "Port Of Loading",
      pod: "Port Of Discharge",
      product: "Product/Items",
      incoTerms: "Incoterms",
      containerSize: "Size of Container",
      numberOfContainers: "No. of Containers",
      commonInvoices: "Commercial Invoices",
      packingLists: "Packing Lists",
      billOfLading: "Bill of Lading",
      insurance: "Insurance",
      others: "Others",
    };
    return labels[docType] || docType;
  };

  const getFields = () => {
    const { tradeType, containerType } = formData;
    if (tradeType === "Import" && containerType === "LCL") {
      return ["cbm", "pkgs", "pol", "pod", "product", "incoTerms"];
    }
    if (tradeType === "Import" && containerType === "FCL") {
      return [
        "containerSize",
        "numberOfContainers",
        "commonInvoices",
        "packingLists",
        "billOfLading",
        "insurance",
        "others",
      ];
    }
    if (tradeType === "Export" && containerType === "LCL") {
      return [
        "cbm",
        "pkgs",
        "pol",
        "pod",
        "product",
        "incoTerms",
        "commonInvoices",
        "packingLists",
        "insurance",
        "others",
      ];
    }
    if (tradeType === "Export" && containerType === "FCL") {
      return [
        "containerSize",
        "numberOfContainers",
        "pol",
        "pod",
        "product",
        "incoTerms",
        "commonInvoices",
        "packingLists",
        "insurance",
        "others",
      ];
    }
    return [];
  };

  const isTextField = (docType) =>
    [
      "cbm",
      "pkgs",
      "pol",
      "pod",
      "product",
      "incoTerms",
      "containerSize",
      "numberOfContainers",
    ].includes(docType);

  const handleTextChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      fields: { ...prev.fields, [field]: value },
    }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  // ✅ file picker
  const handleFileChange = async (field) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: false,
      });

      if (result.canceled || result.type === "cancel") return;

      const fileData =
        result.assets && result.assets.length > 0 ? result.assets[0] : result;

      if (!fileData || !fileData.uri) return;

      const file = {
        uri: fileData.uri,
        name: fileData.name || fileData.uri.split("/").pop(),
        size: fileData.size || 0,
      };

      setFormData((prev) => ({
        ...prev,
        fields: { ...prev.fields, [field]: file },
      }));

      setUploadMessages((prev) => ({
        ...prev,
        [field]: "File uploaded successfully ✅",
      }));
    } catch (err) {
      Alert.alert("Error", "Failed to pick file.");
      console.error("DocumentPicker error:", err);
    }
  };

  // ✅ handleSubmit with Base64 encoding + backend upload
  const handleSubmit = async () => {
    const currentFields = getFields();
    const newErrors = {};

    currentFields.forEach((field) => {
      if (field === "insurance" || field === "others") return;
      if (!formData.fields[field] || formData.fields[field] === "") {
        newErrors[field] = `${getLabel(field)} is required`;
      }
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      // 🔹 convert all uploaded files to base64
      const encodedFiles = {};
      for (const [key, file] of Object.entries(formData.fields)) {
        if (file && file.uri) {
          const converted = await uriToBase64(file);
          if (converted) encodedFiles[key] = converted;
        } else {
          encodedFiles[key] = file; // text fields
        }
      }

      const payload = {
        tradeType: formData.tradeType,
        containerType: formData.containerType,
        fields: encodedFiles,
      };

      const response = await fetch("http://localhost:3000/api/freight/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error:", errorText);
        Alert.alert("Error", "Failed to submit Freight Form.");
        return;
      }

      const result = await response.json();
      console.log("Freight form upload result:", result);
      Alert.alert("Success", "Freight forwarding data submitted successfully ✅");

      onSubmit?.(payload);
    } catch (error) {
      console.error("Freight upload error:", error);
      Alert.alert("Error", "An error occurred while uploading data.");
    }
  };

  const fields = getFields();
  const textFields = fields.filter(isTextField);
  const fileFields = fields.filter((f) => !isTextField(f));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Freight Forwarding</Text>

      {/* Trade Type */}
      <Text style={styles.label}>Trade Type</Text>
      <View style={styles.cityToggleContainer}>
        {["Import", "Export"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.cityBtn,
              formData.tradeType === type && styles.activeBtn,
            ]}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                tradeType: type,
                fields: {},
              }))
            }
          >
            <Text
              style={[
                styles.cityText,
                formData.tradeType === type && styles.activeText,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Container Type */}
      <Text style={styles.label}>Container Type</Text>
      <View style={styles.cityToggleContainer}>
        {["LCL", "FCL"].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.cityBtn,
              formData.containerType === type && styles.activeBtn,
            ]}
            onPress={() =>
              setFormData((prev) => ({
                ...prev,
                containerType: type,
                fields: {},
              }))
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

      {/* Dynamic Inputs */}
      {textFields.map((field) => (
        <View key={field} style={{ marginBottom: 14 }}>
          <Text style={styles.label}>
            {getLabel(field)}
            {field !== "insurance" && field !== "others" && (
              <Text style={{ color: "red" }}> *</Text>
            )}
          </Text>

          {field === "containerSize" ? (
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.fields.containerSize || ""}
                onValueChange={(value) =>
                  handleTextChange("containerSize", value)
                }
                style={styles.picker}
              >
                <Picker.Item label="Select size" value="" color="#94A3B8" />
                <Picker.Item label="20ft" value="20ft" />
                <Picker.Item label="40ft" value="40ft" />
                <Picker.Item label="Flat Rack" value="Flat Rack" />
                <Picker.Item label="Reefer" value="Reefer" />
              </Picker>
            </View>
          ) : (
            <TextInput
              style={styles.input}
              placeholder={
                field === "incoTerms"
                  ? "e.g: FOB, CFR, Ex-Works, etc"
                  : `Enter ${getLabel(field)}`
              }
              placeholderTextColor="#94A3B8"
              value={formData.fields[field] || ""}
              onChangeText={(value) => handleTextChange(field, value)}
            />
          )}
          {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
      ))}

      {/* File Uploads */}
      {fileFields.map((field) => (
        <View key={field} style={{ marginBottom: 14 }}>
          <Text style={styles.label}>
            {getLabel(field)}
            {field !== "insurance" && field !== "others" && (
              <Text style={{ color: "red" }}> *</Text>
            )}
          </Text>
          <TouchableOpacity
            style={styles.uploadBox}
            onPress={() => handleFileChange(field)}
          >
            <Upload color={formData.fields[field]?.name ? "#334155" : "#94A3B8"} />
            <Text
              style={[
                styles.uploadText,
                !formData.fields[field]?.name && styles.placeholderText,
              ]}
            >
              {formData.fields[field]?.name || "Tap to upload"}
            </Text>
          </TouchableOpacity>
          {uploadMessages[field] && (
            <Text style={styles.successText}>{uploadMessages[field]}</Text>
          )}
          {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
      ))}

      {/* Submit */}
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitText}>
          Submit Freight Forwarding Details
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  label: { fontSize: 16, fontWeight: "600", marginVertical: 8 },
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
  activeText: { color: "#0F172A", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    padding: 10,
    color: "#0F172A",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    height: 45,
    marginBottom: 6,
    paddingHorizontal: 10,
  },
  picker: { color: "#0F172A" },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  uploadText: { marginLeft: 8, color: "#334155" },
  placeholderText: { color: "#94A3B8" },
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
