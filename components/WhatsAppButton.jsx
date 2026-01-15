import React from 'react';
import { TouchableOpacity, StyleSheet, Linking, StyleProp, ViewStyle } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { WHATSAPP_CONFIG } from '../config/whatsapp';

/**
 * WhatsAppButton Component
 * Floating action button that opens WhatsApp chat
 * 
 * @param {string} phoneNumber - WhatsApp phone number (defaults to config)
 * @param {StyleProp<ViewStyle>} style - Additional styles
 * @param {number} iconSize - Icon size (default: 28)
 * @param {string} accessibilityLabel - Accessibility label
 */
export function WhatsAppButton({
  phoneNumber = WHATSAPP_CONFIG.phoneNumber,
  style,
  iconSize = 28,
  accessibilityLabel = 'Contact Cargo360 on WhatsApp',
}) {
  const openWhatsApp = () => Linking.openURL(`https://wa.me/${phoneNumber}`);

  return (
    <TouchableOpacity
      style={[styles.whatsappButton, style]}
      onPress={openWhatsApp}
      activeOpacity={0.85}
      accessibilityLabel={accessibilityLabel}
    >
      <FontAwesome name="whatsapp" size={iconSize} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  whatsappButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#25D366',
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default WhatsAppButton;

