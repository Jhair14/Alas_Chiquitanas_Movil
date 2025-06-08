
import { View, TouchableOpacity, Image, StyleSheet, Dimensions, Animated } from 'react-native';
import React, { useContext, useEffect, useRef } from 'react'; 
import { AppContext } from '../context/AppContext';

const { width } = Dimensions.get('window');

type AnimatedScreens = {
  Home: Animated.Value;
  Map: Animated.Value;
};

type ScreenName = 'Home' | 'Map';

const BAR_HEIGHT = 60;
const INDICATOR_SIZE = 48;
const BAR_WIDTH = 200;
const ICON_SPACING = BAR_WIDTH / 2;

const BottomBar = () => {
  const { navigate, screen } = useContext(AppContext);
  const slideAnim = useRef(new Animated.Value(screen === 'Home' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: screen === 'Home' ? 0 : 1,
      tension: 45,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [screen]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [(BAR_WIDTH - INDICATOR_SIZE) / 4, (BAR_WIDTH + INDICATOR_SIZE) / 4]
  });

  const homeIconColor = screen === 'Home' ? '#E47248' : '#FFFFFF';
  const mapIconColor = screen === 'Map' ? '#E47248' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Background Indicator */}
        <Animated.View 
          style={[
            styles.indicator,
            {
              transform: [{ translateX }]
            }
          ]} 
        />

        {/* Home Button */}
        <TouchableOpacity
          style={[styles.buttonContainer]}
          onPress={() => navigate('Home')}
        >
          <Image 
            source={require('../../assets/home_icon.png')} 
            style={[styles.icon, { tintColor: homeIconColor }]}
          />
        </TouchableOpacity>

        {/* Map Button */}
        <TouchableOpacity
          style={[styles.buttonContainer]}
          onPress={() => navigate('Map')}
        >
          <Image 
            source={require('../../assets/map_icon.png')} 
            style={[styles.icon, { tintColor: mapIconColor }]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  content: {
    height: BAR_HEIGHT,
    backgroundColor: '#333333',
    borderRadius: BAR_HEIGHT / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    position: 'relative',
    width: BAR_WIDTH,
    alignSelf: 'center',
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    backgroundColor: '#333333',
    borderRadius: INDICATOR_SIZE / 2,
    top: (BAR_HEIGHT - INDICATOR_SIZE) / 2,
  },
  buttonContainer: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  icon: {
    width: 28,
    height: 28,
  },
});

export default BottomBar;
