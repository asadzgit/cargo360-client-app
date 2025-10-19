import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, ArrowLeft } from 'lucide-react-native';
import { authAPI } from '../services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (val) => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(val);

  const handleSend = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      Alert.alert('Success', 'Reset code sent to your email.', [
        { text: 'OK', onPress: () => router.replace('/reset-password') }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>Enter your email to receive a reset code</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Mail size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Sending...' : 'Send Reset Code'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#024d9a',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 24,
  },
  backButton: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
  form: { paddingHorizontal: 24, marginTop: 16 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#E2E8F0', height: 48, marginBottom: 16 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: '#1E293B', fontSize: 16 },
  primaryButton: { backgroundColor: '#2563EB', paddingVertical: 14, alignItems: 'center', borderRadius: 12 },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
