import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { CheckIcon } from './CheckIcon';
import { CloseIcon } from './CloseIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ConfirmationModal({ visible, onClose, onOpenMail, onSignUpWithPhone, onLogin }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={onClose} 
        style={styles.overlay}
      >
        <View style={styles.mainFrame} onStartShouldSetResponder={() => true}>
          {/* Close Button - Frame 2087326695 */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <CloseIcon size={14} fillColor="#0F1317" strokeColor="#4E5C6C" />
          </TouchableOpacity>

          {/* Frame 2087326784 - Icon and Text Section */}
          <View style={styles.iconTextFrame}>
            {/* Icon Section */}
            <View style={styles.iconContainer}>
              <CheckIcon size={28} color="#0C9A3B" />
            </View>

            {/* Frame 2087326785 - Text Content */}
            <View style={styles.textContentFrame}>
              <Text style={styles.titleText}>Sent successfully</Text>
              <Text style={styles.messageText}>
                We've sent a confirmation link to your email. Check your inbox or spam folder to continue.
              </Text>
            </View>
          </View>

          {/* MainInput Section */}
          <View style={styles.mainInput}>
            {/* Input Component - Placeholder for future design */}
            <View style={styles.inputContainer}>
              {/* Will be designed later */}
            </View>

            {/* Button - Open mail */}
            <TouchableOpacity 
              style={styles.openMailButton}
              onPress={onOpenMail}
            >
              <Text style={styles.openMailButtonText}>Open mail</Text>
            </TouchableOpacity>
          </View>

          {/* Frame 2087326695 - Action Buttons - Login button */}
          <View style={styles.actionButtonsFrame}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={onLogin}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Main Frame (2087326644)
  mainFrame: {
    display: 'flex',
    maxWidth: 357,
    width: Math.min(357, SCREEN_WIDTH - 32), // Responsive: 357px max, or screen width minus 32px margin
    paddingVertical: 32, // Spacing-9
    paddingHorizontal: 16, // Spacing-5
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24, // Spacing-7
    borderRadius: 16,
    backgroundColor: '#FFF', // rgba(255, 255, 255, 1)
    marginHorizontal: 16, // Horizontal margin to prevent touching screen edges
    position: 'relative', // For absolute positioning of close button
  },
  // Close Button - Frame 2087326695
  closeButton: {
    display: 'flex',
    width: 28,
    height: 28,
    padding: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
    aspectRatio: 1,
    position: 'absolute',
    right: 12,
    top: 12,
    borderRadius: 20,
    backgroundColor: '#F4F6F7', // Button-surface-default
  },
  // Frame 2087326784 - Icon and Text Section
  iconTextFrame: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 24, // Spacing-7
    alignSelf: 'stretch',
  },
  // Icon Container
  iconContainer: {
    display: 'flex',
    width: 52,
    height: 52,
    paddingTop: 12.5,
    paddingRight: 11.5,
    paddingBottom: 11.5,
    paddingLeft: 12.5,
    justifyContent: 'center',
    alignItems: 'center',
    aspectRatio: 1,
    borderRadius: 32,
    backgroundColor: 'rgba(12, 154, 59, 0.1)', // rgba(12, 154, 59, 0.1)
  },
  // Frame 2087326785 - Text Content
  textContentFrame: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12, // Spacing-4
    alignSelf: 'stretch',
  },
  // Title Text - "Sent successfully"
  titleText: {
    color: '#000', // Black/950
    fontSize: 24, // Typecace-Size-3xl
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 28.8, // 120% of 24px
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  // Message Text
  messageText: {
    color: '#464646', // Neutral Colour/800
    fontSize: 14, // Text sm/Regular
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 18.48, // 132% of 14px
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  // MainInput Container
  mainInput: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12, // Spacing-4
    alignSelf: 'stretch',
  },
  // Input Container (i-Input)
  inputContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16, // Spacing-5
    alignSelf: 'stretch',
  },
  // Button - Open mail (ii-Button)
  openMailButton: {
    display: 'flex',
    minHeight: 48,
    paddingVertical: 16, // Spacing-5
    paddingHorizontal: 16, // Spacing-5
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4, // Spacing-2
    alignSelf: 'stretch',
    borderRadius: 24, // Radius-xxxl
    backgroundColor: '#C9D2D8', // Button-surface-medium
  },
  // Open mail button text
  openMailButtonText: {
    color: '#0F1317', // Text-primary
    fontSize: 16, // Text md/Medium
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 21.12, // 132% of 16px
    letterSpacing: -0.16,
  },
  // Action Buttons Frame
  actionButtonsFrame: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  // Login Button
  loginButton: {
    // Text button - no background, just text
  },
  // Login button text
  loginButtonText: {
    color: '#01304E', // Button-background-primary color for text
    fontSize: 16, // Text md/Medium
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 21.12, // 132% of 16px
    letterSpacing: -0.16,
  },
});
