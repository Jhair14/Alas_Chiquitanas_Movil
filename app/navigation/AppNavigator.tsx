import React, { useContext, useRef, useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { AppContext } from '../context/AppContext';
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LogInScreen';
import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import ChatScreen from '../screens/ChatScreen';
import FireTransition from '../components/FireTransition';

const { width } = Dimensions.get('window');

const AppNavigator = () => {
  const { screen, params } = useContext(AppContext);
  const [currentScreen, setCurrentScreen] = useState(screen);
  const [showFireTransition, setShowFireTransition] = useState(false);
  const slideAnim = useRef(new Animated.Value(width)).current;
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (currentScreen === screen) return;

    const shouldShowFire = (
      (currentScreen === 'Welcome' && screen === 'LogIn') ||
      (currentScreen === 'LogIn' && screen === 'Home') ||
      (currentScreen === 'Welcome' && screen === 'Home')
    );

    if (shouldShowFire && !isTransitioning.current) {
      isTransitioning.current = true;
      setShowFireTransition(true);
      // We'll update currentScreen after the transition completes
    } else if (!shouldShowFire) {
      setCurrentScreen(screen);
      animateScreenChange();
    }
  }, [screen]);

  const animateScreenChange = () => {
    slideAnim.setValue(width);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleFireTransitionComplete = () => {
    setShowFireTransition(false);
    setCurrentScreen(screen);
    isTransitioning.current = false;
  };

  const renderScreen = (screenName: string | null) => {
    switch (screenName) {
      case 'Welcome':
        return <WelcomeScreen />;
      case 'LogIn':
        return <LoginScreen />;
      case 'Home':
        return <HomeScreen />;
      case 'Map':
        return <MapScreen />;
      case 'Chat':
        if (params && 'zona' in params) {
          return (
            <ChatScreen
              zona={params.zona}
              nivelPeligro={params.nivelPeligro}
              descripcion={params.descripcion}
              estado={params.estado}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Current Screen */}
      <View style={styles.screenContainer}>
        {renderScreen(currentScreen)}
      </View>

      {/* Fire Transition */}
      <FireTransition
        isVisible={showFireTransition}
        onAnimationComplete={handleFireTransitionComplete}
      />

      {/* Next Screen (for non-fire transitions) */}
      {!showFireTransition && currentScreen !== screen && (
        <Animated.View
          style={[
            styles.screenContainer,
            styles.animatedScreen,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {renderScreen(screen)}
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  animatedScreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default AppNavigator;
