import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useBooking } from '../context/BookingContext';
import { authAPI } from '../services/api';
import { loginScreenStyles } from '../styles/loginScreenStyles';
import { MailIcon } from '../components/MailIcon';
import { KeyIcon } from '../components/KeyIcon';
import { EyeCloseIcon } from '../components/EyeCloseIcon';
import { EyeOpenIcon } from '../components/EyeOpenIcon';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);

  const router = useRouter();
  const { login } = useBooking();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    setShowResendButton(false);
    
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await login(normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      const errorCode = error?.response?.data?.code || error?.code;
      const statusCode = error?.response?.status;
      const errorMessageLower = errorMessage.toLowerCase();
      
      if (__DEV__) {
        console.log('Login Error Debug:', {
          errorMessage,
          errorCode,
          statusCode,
          fullError: error
        });
      }
      
      const isEmailNotVerified = 
        errorCode === 4101 ||
        statusCode === 403 ||
        errorMessageLower.includes('verify your email') || 
        errorMessageLower.includes('verify your email address') ||
        errorMessageLower.includes('email not verified') ||
        errorMessageLower.includes('please verify') ||
        errorMessageLower.includes('check your inbox');
      
      if (isEmailNotVerified) {
        setShowResendButton(true);
      }
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first.');
      return;
    }

    try {
      setResendLoading(true);
      const normalizedEmail = email.toLowerCase().trim();
      await authAPI.resendVerification(normalizedEmail);
      Alert.alert('Success', 'Verification email sent successfully! Please check your inbox. The link will expire in 24 hours.');
      setShowResendButton(false);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send verification email. Please try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={loginScreenStyles.container}>
      {/* Content Wrapper - controls vertical position (top/center/bottom) */}
      <View style={loginScreenStyles.contentWrapper}>
        {/* Main Container - 358px width, centered, with 32px gap between children */}
        <View style={loginScreenStyles.main}>
        {/* Top Heading */}
        <View style={styles.topHeading}>
          {/* Logo Container */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.cargo360Logo}
              resizeMode="contain"
            />
          </View>

          {/* SignUp Text Container */}
          <View style={styles.signUpContainer}>
            <Text style={styles.welcomeBackText}>Welcome back</Text>
            <Text style={styles.signInSubtitle}>
              Sign in to your Cargo360 account to start booking freight.
            </Text>
          </View>
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          {/* 1st Input Field - Email */}
          <View style={styles.inputFieldContainer}>
            <View style={styles.input}>
              <MailIcon size={24} color="#4E5C6C" />
              <TextInput
                style={styles.inputText}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#A3B1BD"
              />
            </View>
          </View>

          {/* 2nd Input Field - Password */}
          <View style={styles.passwordInputContainer}>
            <View style={styles.input}>
              <KeyIcon size={24} color="#4E5C6C" />
              <TextInput
                style={styles.inputText}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholderTextColor="#A3B1BD"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOpenIcon size={24} color="#4E5C6C" />
                ) : (
                  <EyeCloseIcon size={24} color="#4E5C6C" />
                )}
              </TouchableOpacity>
            </View>
            {/* Forget Password Text */}
            <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgetPasswordLink}>
              <Text style={styles.forgetPasswordText}>Forget password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[
            styles.button,
            (email && password && !loading) && styles.buttonEnabled,
            loading && { opacity: 0.5 }
          ]}
          onPress={handleLogin}
          disabled={loading || !email || !password}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Logging in...' : 'Login'}
          </Text>
        </TouchableOpacity>

        {/* Resend Verification Email Button - Shows when login fails due to unverified email */}
        {showResendButton && (
          <View style={styles.verificationBanner}>
            <View style={styles.verificationBannerContent}>
              <MailIcon size={20} color="#F59E0B" />
              <View style={styles.verificationBannerText}>
                <Text style={styles.verificationBannerTitle}>Email Verification Required</Text>
                <Text style={styles.verificationBannerMessage}>
                  Please verify your email address to sign in. Click the button below to resend the verification email.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.resendButton, resendLoading && styles.resendButtonDisabled]}
              onPress={handleResendVerification}
              disabled={resendLoading}
            >
              <MailIcon size={16} color="#FFFFFF" />
              <Text style={styles.resendButtonText}>
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
      {/* End of Main Container */}
      </View>
      {/* End of Content Wrapper */}

      {/* Footer - positioned at bottom of screen */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>New to Cargo360? </Text>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.link}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Top Heading
  topHeading: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4, // Reduced further
    alignSelf: 'stretch',
  },

  // Logo Container
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Spacing-3
    alignSelf: 'stretch',
    position: 'relative',
  },

  // Cargo360 Image Logo
  cargo360Logo: {
    width: 128,
    height: 128,
  },

  // SignUp Text Container
  signUpContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Spacing-3
    alignSelf: 'stretch',
  },

  // Welcome back text
  welcomeBackText: {
    alignSelf: 'stretch',
    color: '#0F1317', // Colors/Text-primary
    textAlign: 'center',
    fontSize: 32, // Typography Size 4xl
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 38.4, // 120% of 32px
  },

  // Sign in subtitle text
  signInSubtitle: {
    color: '#4E5C6C', // Colors/Text-secondary
    textAlign: 'center',
    fontSize: 12, // Typography Size sm
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16.32, // 136% of 12px
    letterSpacing: -0.12,
  },

  // Input Section
  inputSection: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16, // Spacing-5 - reduced from 40
    alignSelf: 'stretch',
  },

  // Input Field Container (for email)
  inputFieldContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4, // Spacing-2
    alignSelf: 'stretch',
  },

  // Password Input Container
  passwordInputContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4, // Spacing-2
    alignSelf: 'stretch',
  },

  // Input (email and password)
  input: {
    display: 'flex',
    height: 48,
    paddingVertical: 16, // Spacing-5
    paddingHorizontal: 12, // Spacing-4
    alignItems: 'center',
    gap: 8, // Spacing-3
    alignSelf: 'stretch',
    borderRadius: 8, // Radius-lg
    backgroundColor: '#FFFFFF', // Colors/Surface/Surface-input
    flexDirection: 'row',
  },

  // Input Text
  inputText: {
    flex: 1,
    color: '#0F1317', // Colors/Text-primary (for actual input text)
    fontSize: 14, // Text sm/Regular
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 18.48, // 132% of 14px
    padding: 0,
  },

  // Forget Password Text
  forgetPasswordText: {
    fontSize: 14, // Typography Size md
    fontWeight: '400',
    color: '#01304E', // Colors/Button-background-primary
    lineHeight: 18.48, // 132% of 14px
  },

  forgetPasswordLink: {
    alignSelf: 'flex-start',
  },

  // Button
  button: {
    display: 'flex',
    minHeight: 48,
    paddingVertical: 16, // Spacing-5
    paddingHorizontal: 16, // Spacing-5
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4, // Spacing-2
    alignSelf: 'stretch',
    borderRadius: 24, // Radius-xxxl
    opacity: 0.5, // Default opacity as per design
    backgroundColor: '#01304E', // Colors/Button-background-primary
  },

  // Button when enabled (remove opacity)
  buttonEnabled: {
    opacity: 1,
  },

  // Button Text
  buttonText: {
    color: '#FFF', // Colors/Text-white
    fontSize: 16, // Typography Size lg (Text md/Medium)
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 21.12, // 132% of 16px
    letterSpacing: -0.16,
  },

  // Footer - positioned at bottom of screen
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'stretch',
    paddingBottom: 40, // Safe area padding at bottom
  },

  footerText: {
    color: '#4E5C6C',
    fontSize: 14,
  },

  link: {
    color: '#01304e',
    fontSize: 14,
    fontWeight: '600',
  },

  // Verification Banner
  verificationBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignSelf: 'stretch',
  },

  verificationBannerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },

  verificationBannerText: {
    flex: 1,
  },

  verificationBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },

  verificationBannerMessage: {
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },

  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },

  resendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },

  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
