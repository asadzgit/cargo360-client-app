// ClearanceModal.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { X } from "lucide-react-native";
import ImportsForm from "./ImportsForm";
import ExportsForm from "./ExportsForm";
import FreightForm from "./FreightForm";

const screenHeight = Dimensions.get("window").height;

export default function ClearanceModal({ visible, onClose }) {
  const [activeTab, setActiveTab] = useState("imports");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSubmit = (formType, data) => {
    alert(`${formType} form submitted successfully!`);
    console.log(`${formType} Data:`, data);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Background overlay */}
      <TouchableOpacity activeOpacity={1} onPress={onClose} style={styles.overlay} />

      {/* Animated box */}
      <Animated.View style={[styles.modalContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <LinearGradient colors={["#01304e", "#024d6f", "#ed8411"]} locations={[0, 0.7, 1]} start={{ x: 0, y: 0 }}  end={{ x: 1, y: 0 }} style={styles.headerGradient}>
  <View style={styles.headerContent}>
    <Text style={styles.headerTitle}>Add Clearance</Text>
    <Text style={styles.headerSubtitle}>Documentation</Text>
  </View>

  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
    <X size={22} color="#fff" />
  </TouchableOpacity>
</LinearGradient>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {[
            { key: "imports", label: "Imports" },
            { key: "exports", label: "Exports" },
            { key: "freight", label: "Freight Forwarding" },
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.tabButton, activeTab === tab.key && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {activeTab === "imports" && <ImportsForm onSubmit={data => handleSubmit("Imports", data)} />}
          {activeTab === "exports" && <ExportsForm onSubmit={data => handleSubmit("Exports", data)} />}
          {activeTab === "freight" && <FreightForm onSubmit={data => handleSubmit("Freight Forwarding", data)} />}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    // backgroundColor:'#fff',
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  modalContainer: {
    flex: 1,
    marginHorizontal: 16,
    marginTop: screenHeight * 0.08,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: { color: "#FFF", fontSize: 20, fontWeight: "700" },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  headerContent: {
  flexDirection: "column",
},

headerTitle: {
  color: "#FFF",
  fontSize: 20,
  fontWeight: "700",
  lineHeight: 22,
},

headerSubtitle: {
  color: "#FFF",
  fontSize: 20,
  fontWeight: "700",
  marginTop: -2,
},

  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#E5E7EB",
    margin: 10,
    borderRadius: 12,
    padding: 6,
  },
  tabButton: { 
    flex: 1, 
    alignItems: "center", 
    padding: 10, 
    borderRadius: 8,
    justifyContent:'center'
  },
  tabText: { fontSize: 14, color: "#777777", fontWeight: "500" },
  tabActive: { 
    backgroundColor: "#fff", 
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabTextActive: { color: "#01304e", fontWeight: "700" },
});
