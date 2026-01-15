import { StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate responsive width - max 358px with 16px padding on each side
const CONTENT_MAX_WIDTH = 358;
const HORIZONTAL_PADDING = 16;
const contentWidth = Math.min(CONTENT_MAX_WIDTH, SCREEN_WIDTH - (HORIZONTAL_PADDING * 2));

export const loginScreenStyles = StyleSheet.create({
  // Outer screen container
  container: {
    flex: 1,
    paddingHorizontal: HORIZONTAL_PADDING, // 16px padding on each side
  },

  // Content wrapper - controls vertical position
  // Change justifyContent to: 'flex-start' (top), 'center' (middle), 'flex-end' (bottom)
  contentWrapper: {
    flex: 1,
    justifyContent: 'center', // Change this to move content: 'flex-start' | 'center' | 'flex-end'
    alignItems: 'center',
    paddingBottom: 80, // Pushes content slightly above center
  },

  // Main Container (logo to button)
  main: {
    display: 'flex',
    width: contentWidth,
    padding: 0,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32, // Spacing-9
  },
});
