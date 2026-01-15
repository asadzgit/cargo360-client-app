import React from 'react';
import Svg, { Path } from 'react-native-svg';

export const KeyIcon = ({ size = 24, color = '#4E5C6C' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.6491 10.4831C13.8732 11.7374 15.8579 11.7374 17.0819 10.4831C18.306 9.22877 18.306 7.19509 17.0819 5.94075C15.8579 4.68642 13.8732 4.68642 12.6491 5.94075C11.4251 7.19509 11.4251 9.22877 12.6491 10.4831ZM12.6491 10.4831L6 17.2966L7.66229 19M8.21639 15.0255L9.87868 16.7288"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
