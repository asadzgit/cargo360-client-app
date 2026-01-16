import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Hash, ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { authAPI } from '../services/api';
import WhatsAppButton from '../components/WhatsAppButton';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login');
    }
  };

  const validatePassword = (p) => p && p.length >= 6; // adjust as needed

  const handleReset = async () => {
    if (!code) {
      Alert.alert('Code required', 'Please enter the verification code sent to your email.');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword(code, password);
      Alert.alert('Success', 'Your password has been reset. Please log in.', [
        { text: 'OK', onPress: () => router.replace('/login') }
      ]);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter the code from your email and set a new password</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Hash size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Verification code"
            value={code}
            onChangeText={setCode}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
        </View>

        <View style={styles.inputContainer}>
          <KeyRound size={20} color="#64748B" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingRight: 44 }]}
            placeholder="New password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPass}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.inputRightIcon} onPress={() => setShowPass(v => !v)}>
            {showPass ? <EyeOff size={20} color="#999999" /> : <Eye size={20} color="#999999" />}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <KeyRound size={20} color="#999999" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { paddingRight: 44 }]}
            placeholder="Confirm new password"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={styles.inputRightIcon} onPress={() => setShowConfirm(v => !v)}>
            {showConfirm ? <EyeOff size={20} color="#999999" /> : <Eye size={20} color="#999999" />}
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
          onPress={handleReset}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>{loading ? 'Resetting...' : 'Reset Password'}</Text>
        </TouchableOpacity>
      </View>
      <WhatsAppButton accessibilityLabel="Contact Cargo360 support on WhatsApp" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    backgroundColor: '#01304e',
    borderBottomLeftRadius: 60,
    borderBottomRightRadius: 60,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: { padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.08)', alignSelf: 'flex-start' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginTop: 12, marginBottom: 4, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#FFFFFF', textAlign: 'center' },
  form: { paddingHorizontal: 24, marginTop: 16 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFFFFF', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    borderWidth: 2, 
    borderColor: '#E5E7EB', 
    height: 48, 
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: { marginRight: 8, color: '#999999' },
  input: { flex: 1, color: '#333333', fontSize: 16 },
  inputRightIcon: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center', alignItems: 'center' },
  primaryButton: { 
    backgroundColor: '#01304e', 
    paddingVertical: 14, 
    alignItems: 'center', 
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonDisabled: { opacity: 0.7 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
