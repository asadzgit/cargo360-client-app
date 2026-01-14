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

  // ========== SPLASH SCREEN 3 STYLES ==========
  
  // Screen 3 Container - White background - covers full screen
  screen3Container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT + 100, // Extend beyond screen to cover any gaps
    backgroundColor: '#FFFFFF', // Solid white background
    overflow: 'hidden',
  },

  // Screen 3 - Rectangle 105
  rectangle105Screen3: {
    position: 'absolute',
    width: 390,
    height: 843,
    top: 1,
    left: (SCREEN_WIDTH - 390) / 2,
    backgroundColor: 'rgba(244, 246, 247, 0.88)', // #F4F6F7 with 88% opacity
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 40, // Blur 40px
    elevation: 40,
  },

  // Screen 3 - Ellipse 9
  ellipse9Screen3: {
    position: 'absolute',
    width: 358,
    height: 358,
    top: -201,
    left: 171,
    borderRadius: 358, // Fully circular
    backgroundColor: '#0070B2', // Primary Blue Teal-400
    shadowColor: '#0070B2',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 50, // Blur 50px
    elevation: 50,
  },

  // Screen 3 - Vector 4 with gradient
  vector4Screen3: {
    position: 'absolute',
    width: 536,
    height: 568.117,
    top: 423,
    left: -195,
    transform: [{ rotate: '130.658deg' }], // Positive rotation
    shadowColor: 'rgba(0, 0, 0, 0.3)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 1,
    shadowRadius: 50, // Blur 50px
    elevation: 50,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Screen 3 - Mask Group Ellipse12 (larger size)
  ellipse12Screen3: {
    position: 'absolute',
    width: 1045,
    height: 1045,
    top: -65,
    left: -318,
    borderRadius: 1045, // Fully circular
    backgroundColor: 'rgba(217, 217, 217, 0.5)', // #D9D9D9 - reduced opacity to prevent brownish tint
  },

  // Screen 3 - Mask Group Group7176
  group7176Screen3: {
    position: 'absolute',
    width: 469,
    height: 894,
    top: -114,
    left: -26,
    backgroundColor: 'transparent',
  },

  // Screen 3 - Image container wrapper with white background
  imageContainerWrapper: {
    position: 'absolute',
    width: 469,
    height: 698,
    top: -114,
    left: -26,
    backgroundColor: '#FFFFFF', // White background
    overflow: 'hidden',
    zIndex: 2,
  },

  // Screen 3 - Splash truck image
  splashTruckImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },

  // Screen 3 - White square for bottom-left corner
  bottomLeftCorner: {
    position: 'absolute',
    bottom:-20,
    left: 20,
    width: 95, // Size of the corner square
    height: 40,
    backgroundColor: '#FFFFFF',
    borderTopRightRadius: 15, // Rounded corner on the top-right of the square
    zIndex: 3,
  },

  // Screen 3 - White square for bottom-right corner
  bottomRightCorner: {
    position: 'absolute',
    bottom: -20, // Match left corner positioning
    right: 40, // Match left corner offset
    width: 95, // Match left corner width
    height: 40, // Match left corner height
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15, // Rounded corner on the top-left of the square (match left corner radius)
    zIndex: 3,
  },

  // Screen 3 - Buttons container
  // Note: Container extends 100px below screen, so add 100 to get proper spacing from visible bottom
  buttonsContainer: {
    position: 'absolute',
    bottom: 130, // 100px (container extension) + 60px (desired spacing) = 160px from container bottom
    left: (SCREEN_WIDTH - 320) / 2,
    width: 320,
    flexDirection: 'column',
    alignItems: 'stretch', // Ensure buttons don't stretch
    zIndex: 15,
  },

  // Create Account Button (Primary)
  createAccountButton: {
    width: 320,
    height: 48,
    backgroundColor: 'rgba(1, 48, 78, 1)',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 11,
    flexShrink: 0, // Prevent stretching
  },

  createAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Login Button (Secondary)
  loginButton: {
    width: 320,
    height: 48,
    backgroundColor: 'rgba(201, 210, 216, 1)',
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0, // Prevent stretching
  },

  loginButtonText: {
    color: '#01304e',
    fontSize: 16,
    fontWeight: '600',
  },
});
