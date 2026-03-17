/**
 * RecordingIndicator - Visual indicator for active recording
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Text} from 'react-native';

interface RecordingIndicatorProps {
  isRecording: boolean;
}

const RecordingIndicator: React.FC<RecordingIndicatorProps> = ({isRecording}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecording) {
      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.5,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    } else {
      // Reset animation
      pulseAnim.setValue(1);
      opacityAnim.setValue(1);
    }
  }, [isRecording, pulseAnim, opacityAnim]);

  if (!isRecording) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.indicator,
          {
            transform: [{scale: pulseAnim}],
            opacity: opacityAnim,
          },
        ]}
      />
      <Text style={styles.text}>Recording...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    marginRight: 8,
  },
  text: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RecordingIndicator;
