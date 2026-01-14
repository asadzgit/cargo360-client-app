import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { View, Image, Animated, Dimensions, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useBooking } from '../context/BookingContext';
import { splashScreenStyles } from '../styles/splashScreenStyles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function IndexScreen() {
  const router = useRouter();
  const { user, authReady } = useBooking();
  const [currentScreen, setCurrentScreen] = useState(1); // 1, 2, or 3
  const [showLoginPreview, setShowLoginPreview] = useState(false);
  const [showCircle, setShowCircle] = useState(false);
  const circleScale = useState(new Animated.Value(0))[0];
  const loginScale = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!authReady) return;
    
    // Show screen 1 for 2 seconds
    const timer1 = setTimeout(() => {
      setCurrentScreen(2);
    }, 2000);

    // Show screen 2 for 2 seconds, then animate transition to screen 3
    const timer2 = setTimeout(() => {
      // Start showing screen 3 and circle animation
      setShowLoginPreview(true);
      setShowCircle(true);
      
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
        // Screen 3 scales from center
        Animated.timing(loginScale, {
          toValue: 1, // Scale from 0 to 1
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hide circle after animation completes so screen 3 is fully visible
        setShowCircle(false);
        setCurrentScreen(3); // Set to screen 3 to hide screen 2
        // If user is already logged in, navigate to tabs
        if (user) {
          router.replace('/(tabs)');
        }
        // If not logged in, screen 3 remains visible with login/create account buttons
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
          backgroundColor: '#FFFFFF', // Solid white background
          transform: [
            { scale: loginScale },
          ],
          top: 0,
          left: 0,
          zIndex: 3,
        },
      ]}
    >
      {/* Solid white background layer to prevent any color bleeding */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: '#FFFFFF',
        zIndex: 0,
      }} />
      
      <View style={splashScreenStyles.screen3Container}>
        {/* Additional white background layer */}
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT,
          backgroundColor: '#FFFFFF',
          zIndex: 1,
        }} />
        
        {/* Image container with white background */}
        <View style={splashScreenStyles.imageContainerWrapper}>
          <Image
            source={require('../assets/images/splash-truck.jpg')}
            style={splashScreenStyles.splashTruckImage}
            resizeMode="cover"
          />
          {/* White square for bottom-left corner */}
          <View style={splashScreenStyles.bottomLeftCorner} />
          {/* White square for bottom-right corner */}
          <View style={splashScreenStyles.bottomRightCorner} />
        </View>
        
        {/* White background covering entire bottom area and extending beyond */}
        <View style={{
          position: 'absolute',
          bottom: -50, // Extend beyond screen to cover any gaps
          left: 0,
          width: SCREEN_WIDTH,
          height: SCREEN_HEIGHT * 0.4, // Cover bottom 40% of screen
          backgroundColor: '#FFFFFF',
          zIndex: 8,
        }} />
        
        {/* Buttons Container */}
        <View style={splashScreenStyles.buttonsContainer}>
          {/* Create Account Button (Primary) */}
          <TouchableOpacity
            style={splashScreenStyles.createAccountButton}
            onPress={() => router.replace('/signup')}
            activeOpacity={0.8}
          >
            <Text style={splashScreenStyles.createAccountButtonText}>Create account</Text>
          </TouchableOpacity>
          
          {/* Login Button (Secondary) */}
          <TouchableOpacity
            style={splashScreenStyles.loginButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.8}
          >
            <Text style={splashScreenStyles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* Render current screen */}
      {currentScreen === 1 && renderScreen1()}
      
      {/* Screen 2 (bottom layer) - only show when currentScreen is 2 */}
      {currentScreen === 2 && renderScreen2()}
      
      {/* Screen 3 - appears from center immediately as circle expands (above screen 2, below circle during animation) */}
      {(showLoginPreview || currentScreen === 3) && renderLoginPreview()}
      
      {/* Transition circle animation (appears from center when transitioning from screen 2 to 3) */}
      {showCircle && (
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