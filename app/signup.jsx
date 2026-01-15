import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Dimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { User, Phone, Building2, Eye, EyeOff } from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';
import { loginScreenStyles } from '../styles/loginScreenStyles';
import { MailIcon } from '../components/MailIcon';
import { KeyIcon } from '../components/KeyIcon';
import { EyeCloseIcon } from '../components/EyeCloseIcon';
import { EyeOpenIcon } from '../components/EyeOpenIcon';
import ConfirmationModal from '../components/ConfirmationModal';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyError, setCompanyError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  
  const router = useRouter();
  const { signup } = useBooking();

  const handleOpenPrivacyPolicy = async () => {
    const url = 'https://app.cargo360pk.com/privacy-policy';
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open the link.');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open the link.');
    }
  };

  const handleSignup = async () => {
    if (!name || !email || !password || !phone || !company) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }

    // Validate company name: minimum 3 characters, letters and spaces only
    if (company.length < 3) {
      Alert.alert('Error', 'Company name must be at least 3 characters');
      return;
    }
    if (!/^[a-zA-Z\s]+$/.test(company)) {
      Alert.alert('Error', 'Company name can only contain letters and spaces');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const payload = { name, email: normalizedEmail, company, password };
      if (phone) payload.phone = phone;
      const response = await signup(payload);
      
      if (response?.error) {
        Alert.alert('Error', response.error);
      } else {
        // Show confirmation modal on success
        setShowConfirmationModal(true);
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={loginScreenStyles.container}>
      {/* Content Wrapper - controls vertical position (top/center/bottom) */}
      <View style={[loginScreenStyles.contentWrapper, styles.contentWrapperOverride]}>
        {/* Main Container - 358px width, centered, with 32px gap between children */}
        <ScrollView 
          style={{ width: loginScreenStyles.main.width }}
          contentContainerStyle={{
            display: 'flex',
            padding: 0,
            flexDirection: 'column',
            alignItems: 'center',
            gap: 32,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.welcomeBackText}>Let's get started</Text>
              <Text style={styles.signInSubtitle}>
                Enter a valid email we'll send a confirmation code.
              </Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            {/* 1st Input Field - Name */}
            <View style={styles.inputFieldContainer}>
              <View style={styles.input}>
                <User size={24} color="#4E5C6C" />
                <TextInput
                  style={styles.inputText}
                  placeholder="Full name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  placeholderTextColor="#A3B1BD"
                />
              </View>
            </View>

            {/* 2nd Input Field - Company */}
            <View style={styles.inputFieldContainer}>
              <View style={[styles.input, companyError && styles.inputError]}>
                <Building2 size={24} color="#4E5C6C" />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter company name"
                  value={company}
                  onChangeText={(text) => {
                    const hasInvalidChars = /[^a-zA-Z0-9\s]/.test(text);
                    const sanitized = text.replace(/[^a-zA-Z0-9\s]/g, '');
                    setCompany(sanitized);
                    
                    if (hasInvalidChars) {
                      setCompanyError('Company name can only contain letters, numbers, and spaces');
                    } else {
                      if (sanitized.length === 0) {
                        setCompanyError('Company name is required');
                      } else if (sanitized.length < 3) {
                        setCompanyError('Company name must be at least 3 characters');
                      } else {
                        const letterCount = (sanitized.match(/[a-zA-Z]/g) || []).length;
                        if (letterCount < 3) {
                          setCompanyError('Company name must contain at least 3 letters');
                        } else {
                          const isOnlyDigits = /^\d+$/.test(sanitized.replace(/\s/g, ''));
                          if (isOnlyDigits) {
                            setCompanyError('Company name cannot contain only digits');
                          } else {
                            setCompanyError('');
                          }
                        }
                      }
                    }
                  }}
                  onBlur={() => {
                    if (company.length === 0) {
                      setCompanyError('Company name is required');
                    } else if (company.length < 3) {
                      setCompanyError('Company name must be at least 3 characters');
                    } else if (!/^[a-zA-Z0-9\s]+$/.test(company)) {
                      setCompanyError('Company name can only contain letters, numbers, and spaces');
                    } else {
                      const letterCount = (company.match(/[a-zA-Z]/g) || []).length;
                      if (letterCount < 3) {
                        setCompanyError('Company name must contain at least 3 letters');
                      } else {
                        const isOnlyDigits = /^\d+$/.test(company.replace(/\s/g, ''));
                        if (isOnlyDigits) {
                          setCompanyError('Company name cannot contain only digits');
                        } else {
                          setCompanyError('');
                        }
                      }
                    }
                  }}
                  placeholderTextColor="#A3B1BD"
                />
              </View>
              {companyError ? <Text style={styles.errorText}>{companyError}</Text> : null}
            </View>

            {/* 3rd Input Field - Phone */}
            <View style={styles.inputFieldContainer}>
              <View style={styles.input}>
                <Phone size={24} color="#4E5C6C" />
                <TextInput
                  style={styles.inputText}
                  placeholder="Phone number"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor="#A3B1BD"
                />
              </View>
            </View>

            {/* 4th Input Field - Email */}
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

            {/* 5th Input Field - Password */}
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
            </View>
          </View>

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.button,
              (name && email && company && phone && password && !loading && !companyError) && styles.buttonEnabled,
              loading && { opacity: 0.5 }
            ]}
            onPress={handleSignup}
            disabled={loading || !name || !email || !company || !phone || !password || !!companyError}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating Account...' : "Let's get started"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      {/* End of Content Wrapper */}

      {/* Footer - positioned at bottom of screen */}
      <View style={styles.footer}>
        {/* SignIn Section */}
        <View style={styles.signInSection}>
          <Text style={styles.alreadyHaveAccountText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>

        {/* Terms & Conditions Section */}
        <View style={styles.tcSection}>
          <Text style={styles.tcText}>
            By continuing, you agree to our{' '}
            <Text style={styles.tcLink} onPress={handleOpenPrivacyPolicy}>
              T&C
            </Text>
            {' '}and{' '}
            <Text style={styles.tcLink} onPress={handleOpenPrivacyPolicy}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onOpenMail={() => {
          // TODO: Implement open mail functionality
          setShowConfirmationModal(false);
        }}
        onSignUpWithPhone={() => {
          // TODO: Implement sign up with phone number
          setShowConfirmationModal(false);
        }}
        onLogin={() => {
          setShowConfirmationModal(false);
          router.push('/login');
        }}
      />
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Content Wrapper Override - move content down
  contentWrapperOverride: {
    justifyContent: 'flex-start',
    paddingTop: 60,
    paddingBottom: 0,
  },

  // Top Heading
  topHeading: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    alignSelf: 'stretch',
  },

  // Logo Container
  logoContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
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
    gap: 8,
    alignSelf: 'stretch',
  },

  // Welcome back text
  welcomeBackText: {
    alignSelf: 'stretch',
    color: '#0F1317',
    textAlign: 'center',
    fontSize: 32,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 38.4,
  },

  // Sign in subtitle text
  signInSubtitle: {
    color: '#4E5C6C',
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16.32,
    letterSpacing: -0.12,
  },

  // Input Section
  inputSection: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
  },

  // Input Field Container
  inputFieldContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    alignSelf: 'stretch',
  },

  // Password Input Container
  passwordInputContainer: {
    display: 'flex',
    padding: 0,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    alignSelf: 'stretch',
  },

  // Input (email and password)
  input: {
    display: 'flex',
    height: 48,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
  },

  // Input Error State
  inputError: {
    borderWidth: 1,
    borderColor: '#DC2626',
  },

  // Input Text
  inputText: {
    flex: 1,
    color: '#0F1317',
    fontSize: 14,
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 18.48,
    padding: 0,
  },

  // Error Text
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16.32,
    marginTop: 4,
  },

  // Button
  button: {
    display: 'flex',
    minHeight: 48,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'stretch',
    borderRadius: 24,
    opacity: 0.5,
    backgroundColor: '#01304E',
  },

  // Button when enabled (remove opacity)
  buttonEnabled: {
    opacity: 1,
  },

  // Button Text
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 21.12,
    letterSpacing: -0.16,
  },

  // Footer - positioned at bottom of screen
  footer: {
    display: 'flex',
    maxWidth: 390,
    width: Math.min(390, SCREEN_WIDTH - 32), // Responsive: 390px max, or screen width minus 32px margin
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16, // Spacing-5
    paddingBottom: 40,
    alignSelf: 'center',
  },

  // SignIn Section
  signInSection: {
    display: 'flex',
    paddingVertical: 0,
    paddingHorizontal: 20, // Spacing-6
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Spacing-3
    alignSelf: 'stretch',
    flexDirection: 'row',
  },

  // Already have an account text
  alreadyHaveAccountText: {
    color: '#4E5C6C', // Text-secondary
    textAlign: 'center',
    fontSize: 12, // Text xsm/Regular
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 16.32, // 136% of 12px
    letterSpacing: -0.12,
  },

  // Sign in link
  signInLink: {
    color: '#01304E', // Button-background-primary
    fontSize: 14, // Text sm/Medium
    fontStyle: 'normal',
    fontWeight: '500',
    lineHeight: 18.48, // 132% of 14px
  },

  // Terms & Conditions Section
  tcSection: {
    display: 'flex',
    paddingVertical: 0,
    paddingHorizontal: 20, // Spacing-6
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8, // Spacing-3
    alignSelf: 'stretch',
  },

  // Terms & Conditions text
  tcText: {
    color: '#4E5C6C', // Text-secondary
    textAlign: 'center',
    fontSize: 10, // Text xsm/Regular
    fontStyle: 'normal',
    fontWeight: '400',
    lineHeight: 13.6, // 136% of 10px
    letterSpacing: -0.1,
    alignSelf: 'stretch',
  },

  // T&C and Privacy Policy link within the text
  tcLink: {
    color: '#01304E', // Button-background-primary (same as Sign in link)
    fontSize: 10, // Text xsm/Regular
    fontStyle: 'normal',
    fontWeight: '500', // Medium weight (same as Sign in link)
    lineHeight: 13.6, // 136%
    letterSpacing: -0.1,
  },
});
