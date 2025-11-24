import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useBooking } from '../context/BookingContext';

export default function IndexScreen() {
  const router = useRouter();
  const { user, authReady } = useBooking();

  useEffect(() => {
    if (!authReady) return;
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/login');
    }
  }, [authReady, user, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Cargo360</Text>
      <Text style={styles.subtitle}>Professional logistics for modern businesses</Text>
      <View style={styles.loaderRow}>
        <ActivityIndicator size="small" color="#ed8411" />
        <Text style={styles.loaderText}>Loading your account...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#01304e',
    paddingHorizontal: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CBD5F5',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 24,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  loaderText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});