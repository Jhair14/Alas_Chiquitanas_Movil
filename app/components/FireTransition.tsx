import React, { useEffect, useRef, ReactElement } from 'react';
import { View, Animated, Dimensions, StyleSheet, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

interface FireTransitionProps {
  isVisible: boolean;
  onAnimationComplete?: () => void;
}

type WaveColors = [ColorValue, ColorValue, ColorValue, ColorValue];

const FireTransition = ({ isVisible, onAnimationComplete }: FireTransitionProps) => {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (isVisible) {
      translateY.setValue(height);
      
      Animated.timing(translateY, {
        toValue: -height,
        duration: 1500,
        useNativeDriver: true,
      }).start(() => {
        onAnimationComplete?.();
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const renderWaves = (): ReactElement[] => {
    const waves: ReactElement[] = [];
    const waveColors: WaveColors[] = [
      ['#FF0000', '#FF0000', '#FF2000', '#FF4000'] as WaveColors,
      ['#FF1000', '#FF2000', '#FF4000', '#FF6000'] as WaveColors,
      ['#FF2000', '#FF4000', '#FF6000', '#FF8000'] as WaveColors,
      ['#FF4000', '#FF6000', '#FF8000', '#FFA000'] as WaveColors,
      ['#FF6000', '#FF8000', '#FFA000', '#FFC000'] as WaveColors,
      ['#FF8000', '#FFA000', '#FFC000', '#FFD000'] as WaveColors,
      ['#FFA000', '#FFC000', '#FFD000', '#FFE000'] as WaveColors,
      ['#FFC000', '#FFD000', '#FFE000', '#FFE000'] as WaveColors
    ];

    
    waveColors.forEach((colors, index) => {
      const waveHeight = height / 2.5; 
      const topPosition = index * (waveHeight / 3.5); 

      waves.push(
        <View
          key={index}
          style={[
            styles.wave,
            {
              top: topPosition,
              height: waveHeight,
            }
          ]}
        >
          <LinearGradient
            colors={colors}
            style={[
              styles.waveGradient,
              {
                borderTopLeftRadius: 150,
                borderTopRightRadius: 150,
                transform: [
                  { scaleX: 1.4 } 
                ]
              }
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
      );
    });

    return waves;
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ translateY }]
        }
      ]}
      pointerEvents="none"
    >
      <View style={styles.wavesContainer}>
        {renderWaves()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: height * 2,
    zIndex: 999,
  },
  wavesContainer: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#FFE000', 
  },
  wave: {
    position: 'absolute',
    left: -50,
    right: -50,
    overflow: 'hidden',
  },
  waveGradient: {
    flex: 1,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
  }
});

export default FireTransition; 