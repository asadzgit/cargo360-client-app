import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking, BackHandler } from 'react-native';
import { useEffect } from 'react';

export default function UpdateRequiredScreen({ storeUrl, isForced = true }) {
  useEffect(() => {
    // Disable back button on Android when forced update
    if (isForced) {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return true; // Prevent default back button behavior
      });
      return () => backHandler.remove();
    }
  }, [isForced]);

  const handleUpdateNow = () => {
    if (storeUrl) {
      Linking.openURL(storeUrl).catch(err => {
        console.error('Failed to open store URL:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Optional: Add app logo here */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>Update Required</Text>
        
        <Text style={styles.message}>
          A new version of the app is available.
          {'\n'}
          Please update to continue using the app.
        </Text>

        <TouchableOpacity
          style={styles.updateButton}
          onPress={handleUpdateNow}
          activeOpacity={0.8}
        >
          <Text style={styles.updateButtonText}>Update Now</Text>
        </TouchableOpacity>

        {!isForced && (
          <Text style={styles.note}>
            Note: You can continue using the app, but updating is recommended for the best experience.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01304e',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#CBD5F5',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  updateButton: {
    backgroundColor: '#ed8411',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: 16,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  note: {
    fontSize: 14,
    color: '#CBD5F5',
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
});


