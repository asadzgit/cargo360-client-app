import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { authAPI } from '../services/api';

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
    setShowResendButton(false); // Reset resend button visibility
    
    try {
      // Convert email to lowercase for case-insensitive login
      const normalizedEmail = email.toLowerCase().trim();
      await login(normalizedEmail, password);
      router.replace('/(tabs)');
    } catch (error) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      
      // Check if error is due to email not being verified
      // Check error code (4101 = EMAIL_NOT_VERIFIED), status code (403), or error message
      const errorCode = error?.response?.data?.code || error?.code;
      const statusCode = error?.response?.status;
      const errorMessageLower = errorMessage.toLowerCase();
      
      // Debug: log error details (remove in production)
      if (__DEV__) {
        console.log('Login Error Debug:', {
          errorMessage,
          errorCode,
          statusCode,
          fullError: error
        });
      }
      
      const isEmailNotVerified = 
        errorCode === 4101 || // EMAIL_NOT_VERIFIED error code
        statusCode === 403 || // Forbidden status (used for email not verified)
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
      // Normalize email to lowercase for case-insensitive handling
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
    <View style={styles.container}>
      <View style={styles.header}>
      <Image 
          source={require('../assets/images/icon.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your Cargo360 account</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingRight: 44 }]}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.inputRightIcon}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff size={20} color="#999999" />
            ) : (
              <Eye size={20} color="#999999" />
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/forgot-password')} style={{ alignSelf: 'flex-end', marginBottom: 12 }}>
          <Text style={{ color: '#01304e', fontWeight: '600' }}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Resend Verification Email Button - Shows when login fails due to unverified email */}
        {showResendButton && (
          <View style={styles.verificationBanner}>
            <View style={styles.verificationBannerContent}>
              <Mail size={20} color="#F59E0B" />
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
              <Mail size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.resendButtonText}>
                {resendLoading ? 'Sending...' : 'Resend Verification Email'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Signing In...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.link}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 24,
    justifyContent: 'center',
  },
  logo: {
    width: 128,
    height: 128,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#01304e',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    marginRight: 12,
    color: '#999999',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 12,
  },
  button: {
    backgroundColor: '#01304e',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#777777',
    fontSize: 14,
  },
  link: {
    color: '#01304e',
    fontSize: 14,
    fontWeight: '600',
  },
  inputRightIcon: {
    position: 'absolute',
    right: 12,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verificationBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resendButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  resendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});