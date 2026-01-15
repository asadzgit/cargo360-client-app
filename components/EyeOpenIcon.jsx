import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const EyeOpenIcon = ({ size = 24, color = '#4E5C6C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4.5 12C4.5 12 6.59091 6 12 6C17.4091 6 19.5 12 19.5 12C19.5 12 17.4091 18 12 18C6.59091 18 4.5 12 4.5 12Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 14.25C13.6087 14.25 14.8182 13.1783 14.8182 12C14.8182 10.8217 13.6087 9.75 12 9.75C10.3913 9.75 9.18182 10.8217 9.18182 12C9.18182 13.1783 10.3913 14.25 12 14.25Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
