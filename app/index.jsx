import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to login screen on app start
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cargo360</Text>
      <Text style={styles.subtitle}>Professional logistics solutions for your business</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2563EB',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#93C5FD',
    fontWeight: '500',
  },
});