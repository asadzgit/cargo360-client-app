import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Upload } from "lucide-react-native";

export default function FileUpload({ label, onChange, selectedFile, required }) {
  const [loading, setLoading] = useState(false);

  const pickFile = async () => {
  try {
    setLoading(true);
    const result = await DocumentPicker.getDocumentAsync({
      type: "*/*",
      copyToCacheDirectory: false,
    });
    setLoading(false);

    // 🟢 Handle "cancel"
    if (result.canceled || result.type === "cancel") {
      return onChange?.(null);
    }

    // 🟢 Normalize file object (handle both new + old API structures)
    const fileData = result.assets && result.assets.length > 0 ? result.assets[0] : result;

    if (!fileData || !fileData.uri) {
      return onChange?.(null); // no valid file selected
    }

    const fileName =
      fileData.name ||
      (fileData.uri && fileData.uri.split("/").pop()) ||
      "Unknown file";

    const file = {
      uri: fileData.uri,
      name: fileName,
      size: fileData.size || 0,
    };

    onChange?.(file);
  } catch (err) {
    setLoading(false);
    Alert.alert("Error", "Failed to pick file.");
    console.error("DocumentPicker error:", err);
  }
};


  return (
    <View>
      {/* Label */}
      <Text style={styles.label}>
        {label} {required ? <Text style={{ color: "red" }}>*</Text> : null}
      </Text>

      {/* Upload Box */}
      <TouchableOpacity style={styles.box} onPress={pickFile}>
        <View style={styles.row}>
          <Upload
            color={selectedFile?.name ? "#334155" : "#94A3B8"} // dynamic color
            size={18}
          />

          <Text
            style={[
              styles.boxText,
              !selectedFile?.name && styles.placeholderText,
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {selectedFile?.name ? selectedFile.name : "Tap to upload"}
          </Text>

          {loading && (
            <ActivityIndicator
              size="small"
              style={{ marginLeft: 8 }}
              color="#334155"
            />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
    color: "#111",
  },
  box: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#CBD5E1",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#F8FAFC",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  boxText: {
    color: "#334155",
    fontSize: 14,
    flexShrink: 1,
  },
  placeholderText: {
    color: "#94A3B8", // light gray (same as TextInput placeholder)
  },
});
