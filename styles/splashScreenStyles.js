import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const splashScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Base background color
    position: 'relative',
    overflow: 'hidden',
  },
  
  // Rectangle 105 - Background overlay
  rectangle105: {
    position: 'absolute',
    width: 390,
    height: 843,
    top: 1,
    left: (SCREEN_WIDTH - 390) / 2, // Center horizontally
    backgroundColor: 'rgba(244, 246, 247, 0.88)', // 88% opacity
    shadowColor: 'rgba(15, 19, 23, 0.2)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.32, // density 32%
    shadowRadius: 80, // Blur 80px
    elevation: 80, // For Android
    // Note: size 0.5 in Figma typically refers to shadow spread, 
    // which is handled by shadowRadius in React Native
  },
  
  // Ellipse 9 - Blue circle
  ellipse9: {
    position: 'absolute',
    width: 358,
    height: 358,
    top: -201,
    left: 171,
    borderRadius: 179, // Half of width/height to make it circular
    backgroundColor: 'rgba(0, 112, 178, 0.15)', // Lightened - very light blue
    shadowColor: 'rgba(0, 112, 178, 0.3)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 100, // Blur 100px
    elevation: 100, // For Android
  },
  
  // Vector 4 - Rotated decorative element (CSS-based shape)
  vector4: {
    position: 'absolute',
    width: 536,
    height: 568.12,
    top: 423,
    left: -195,
    backgroundColor: 'rgba(0, 112, 178, 0.1)', // Lightened - very light blue
    transform: [{ rotate: '-130.66deg' }],
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 100, // Blur 100px
    elevation: 100, // For Android
    // CSS-based shape - adjust borderRadius or use other CSS properties as needed
    borderRadius: 20,
  },
  
  // Logo
  logo: {
    position: 'absolute',
    width: 120,
    height: 120,
    top: 362,
    left: 135,
    zIndex: 10, // Ensure logo is on top
  },

  // ========== SPLASH SCREEN 2 STYLES ==========
  
  // Screen 2 Container
  screen2Container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
  },

  // Screen 2 - Vector 4 (same as screen 1 - light styling)
  vector4Screen2: {
    position: 'absolute',
    width: 536,
    height: 568.12,
    top: 423,
    left: -195,
    backgroundColor: 'rgba(0, 112, 178, 0.1)', // Lightened - very light blue (same as screen 1)
    transform: [{ rotate: '-130.66deg' }],
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 100, // Blur 100px
    elevation: 100, // For Android
    borderRadius: 20,
  },

  // Screen 2 - Ellipse 9 (same as screen 1 - light styling)
  ellipse9Screen2: {
    position: 'absolute',
    width: 358,
    height: 358,
    top: -201,
    left: 171,
    borderRadius: 179,
    backgroundColor: 'rgba(0, 112, 178, 0.15)', // Lightened - very light blue (same as screen 1)
    shadowColor: 'rgba(0, 112, 178, 0.3)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 100, // Blur 100px
    elevation: 100, // For Android
  },

  // Mask Group - Group7176
  group7176: {
    position: 'absolute',
    width: 469,
    height: 894,
    top: -114,
    left: -26,
    // Mask group - may need specific styling based on Figma
    // For now, leaving as transparent container
    backgroundColor: 'transparent',
  },

  // Mask Group - Ellipse12
  ellipse12: {
    position: 'absolute',
    width: 17,
    height: 17,
    top: 449,
    left: 196,
    borderRadius: 8.5, // Half of width/height to make it circular
    backgroundColor: 'rgba(217, 217, 217, 1)',
  },

  // Transition circle (for animation from screen 2 to screen 3)
  transitionCircle: {
    position: 'absolute',
    borderRadius: 1000, // Large enough to cover screen
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
});
