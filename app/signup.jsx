import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Truck, Mail, Lock, User, Phone,Building2, Eye, EyeOff} from 'lucide-react-native';
import { useBooking } from '../context/BookingContext';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { signup } = useBooking();
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !phone || !company) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    
    try {
      const payload = { name, email, company, password };
      if (phone) payload.phone = phone;
      const response = await signup(payload);
      
      if (response?.error) {
        Alert.alert('Error', response.error);
      } else if (response?.message) {
        // Show success message and navigate to login
        Alert.alert('Success', response.message, [
          { text: 'OK', onPress: () => router.replace('/login') }
        ]);
      } else {
        // Fallback: navigate to login
        router.replace('/login');
      }
    } catch (error) {
      Alert.alert('Error', error?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Truck size={48} color="#01304e" />
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Cargo360 and start booking</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <User size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#94A3B8"
          />
        </View>

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

        {/* 🟢 New Company Name Field (added below email) */}
        <View style={styles.inputContainer}>
          <Building2 size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Company name"
            value={company}
            onChangeText={setCompany}
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
          <Phone size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
  <Lock size={20} color="#999999" style={styles.inputIcon} />

  <TextInput
    style={styles.input}
    placeholder="Password (min 6 characters)"
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}      // ✅ Toggle password visibility
    placeholderTextColor="#94A3B8"
  />

  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
    {showPassword ? (
      <EyeOff size={20} color="#999999" />
    ) : (
      <Eye size={20} color="#999999" />
    )}
  </TouchableOpacity>
</View>


        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text style={styles.link}>Sign In</Text>
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
});