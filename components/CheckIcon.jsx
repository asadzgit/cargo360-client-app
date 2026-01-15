import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const CheckIcon = ({ size = 28, color = '#0C9A3B' }) => (
  <Svg width={size} height={size} viewBox="0 0 21 15" fill="none">
    <Path
      d="M1 7.07639L7.07639 13.1528L19.2292 1"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
