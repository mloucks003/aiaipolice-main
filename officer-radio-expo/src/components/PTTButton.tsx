/**
 * PTTButton - Push-to-Talk button component
 */

import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
  View,
  Vibration,
} from 'react-native';
import {PTTCallbacks} from '../types/ptt';

interface PTTButtonProps {
  isRecording: boolean;
  isDisabled: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
}

const PTTButton: React.FC<PTTButtonProps> = ({
  isRecording,
  isDisabled,
  onPressIn,
  onPressOut,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (isDisabled) return;
    
    // Haptic feedback
    Vibration.vibrate(50);
    
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
    
    onPressIn();
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    
    // Haptic feedback
    Vibration.vibrate(50);
    
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    
    onPressOut();
  };

  const buttonStyle = [
    styles.button,
    isRecording && styles.buttonRecording,
    isDisabled && styles.buttonDisabled,
  ];

  return (
    <Animated.View style={[styles.container, {transform: [{scale: scaleAnim}]}]}>
      <TouchableOpacity
        style={buttonStyle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        activeOpacity={0.8}>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonText}>
            {isRecording ? 'TRANSMITTING' : 'PUSH TO TALK'}
          </Text>
          <Text style={styles.buttonSubtext}>
            {isRecording ? 'Release to send' : 'Hold to speak'}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: '#F44336',
  },
  buttonDisabled: {
    backgroundColor: '#9E9E9E',
    opacity: 0.5,
  },
  buttonContent: {
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  buttonSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default PTTButton;
