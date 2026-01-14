import React from 'react';
import { TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const DEFAULT_NUMBER = '923337766609';

export default function WhatsAppButton({
  phoneNumber = DEFAULT_NUMBER,
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
    bottom: 32,
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

