import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Image, Animated, Dimensions } from 'react-native';
import { useBooking } from '../context/BookingContext';
import { splashScreenStyles } from '../styles/splashScreenStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IndexScreen() {
  const router = useRouter();
  const { user, authReady } = useBooking();
  const [currentScreen, setCurrentScreen] = useState(1); // 1, 2, or 3
  const [showLoginPreview, setShowLoginPreview] = useState(false);
  const circleScale = useState(new Animated.Value(0))[0];
  const loginScale = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!authReady) return;
    
    // Show screen 1 for 2 seconds
    const timer1 = setTimeout(() => {
      setCurrentScreen(2);
    }, 2000);

    // Show screen 2 for 2 seconds, then animate transition to login screen
    const timer2 = setTimeout(() => {
      // Start showing login preview and animate both circle and login screen
      setShowLoginPreview(true);
      
      // Reset and animate both simultaneously
      circleScale.setValue(0);
      loginScale.setValue(0);
      
      Animated.parallel([
        // Circle expands from center
        Animated.timing(circleScale, {
          toValue: 1, // Scale to cover screen
          duration: 800,
          useNativeDriver: false,
        }),
        // Login screen scales from center
        Animated.timing(loginScale, {
          toValue: 1, // Scale from 0 to 1
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Navigate directly to login screen (screen 3 is the login screen)
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/login');
        }
      });
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [authReady, user, router, circleScale, loginScale]);

  const renderScreen1 = () => (
    <View style={splashScreenStyles.container}>
      {/* Rectangle 105 - Background overlay */}
      <View style={splashScreenStyles.rectangle105} />
      
      {/* Ellipse 9 - Blue circle */}
      <View style={splashScreenStyles.ellipse9} />
      
      {/* Vector 4 - Rotated decorative element */}
      <View style={splashScreenStyles.vector4} />
      
      {/* Logo */}
      <Image
        source={require('../assets/images/icon.png')}
        style={splashScreenStyles.logo}
        resizeMode="contain"
      />
    </View>
  );

  const renderScreen2 = () => (
    <View style={[splashScreenStyles.screen2Container, { zIndex: 2 }]}>
      {/* Rectangle 105 - Background overlay */}
      <View style={splashScreenStyles.rectangle105} />
      
      {/* Ellipse 9 - Blue circle */}
      <View style={splashScreenStyles.ellipse9Screen2} />
      
      {/* Vector 4 - Rotated decorative element (same as screen 1) */}
      <View style={splashScreenStyles.vector4Screen2} />
      
      {/* Mask Group - Group7176 */}
      <View style={splashScreenStyles.group7176} />
      
      {/* Mask Group - Ellipse12 */}
      <View style={splashScreenStyles.ellipse12} />
      
      {/* Logo */}
      <Image
        source={require('../assets/images/icon.png')}
        style={splashScreenStyles.logo}
        resizeMode="contain"
      />
    </View>
  );

  const renderLoginPreview = () => (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: '#F8FAFC',
          // Scale from center - React Native scales from view center by default
          transform: [
            { scale: loginScale },
          ],
          top: 0,
          left: 0,
          zIndex: 3, // Above screen 2, below circle - visible immediately as it expands
        },
      ]}
    >
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <Image
            source={require('../assets/images/icon.png')}
            style={{ width: 128, height: 128 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Render current screen */}
      {currentScreen === 1 && renderScreen1()}
      
      {/* Screen 2 (bottom layer) */}
      {currentScreen === 2 && renderScreen2()}
      
      {/* Login screen preview - appears from center immediately as circle expands (above screen 2, below circle) */}
      {showLoginPreview && renderLoginPreview()}
      
      {/* Transition circle animation (appears from center when transitioning from screen 2 to 3) */}
      {currentScreen === 2 && (
        <Animated.View
          style={[
            splashScreenStyles.transitionCircle,
            {
              width: circleScale.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5],
              }),
              height: circleScale.interpolate({
                inputRange: [0, 1],
                outputRange: [0, Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 2.5],
              }),
              // Center the circle - starts at center point and expands outward
              top: circleScale.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_HEIGHT / 2, SCREEN_HEIGHT / 2 - (Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 1.25)],
              }),
              left: circleScale.interpolate({
                inputRange: [0, 1],
                outputRange: [SCREEN_WIDTH / 2, SCREEN_WIDTH / 2 - (Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) * 1.25)],
              }),
              zIndex: 1000,
            },
          ]}
        />
      )}
    </View>
  );
}