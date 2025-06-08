import React, { useContext } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const { navigate } = useContext(AppContext);
  const scaleAnim = new Animated.Value(1);

  const handlePress = (screen: keyof RootStackParamList) => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      }),
    ]).start(() => {
      navigate(screen);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ImageBackground
        source={require('../../assets/fire_pattern.jpg')}
        style={styles.backgroundPattern}
        imageStyle={{ opacity: 0.35 }}
      >
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>BIENVENIDO A ALAS{'\n'}CHIQUITANAS</Text>
            <Text style={styles.subtitle}>MANTENTE AL DÍA Y AYUDA A TU COMUNIDAD</Text>
          </View>

          <View style={styles.darkCard}>
            <Text style={styles.description}>Ayuda a tu comunidad y tambien a{'\n'}quienes la ayuda</Text>

            <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => handlePress('Home')}
              >
                <View style={styles.buttonContent}>
                  <Image source={require('../../assets/perfil.png')} style={styles.icon} />
                  <Text style={styles.buttonText}>Seguir como invitado</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => handlePress('LogIn')}
              >
                <View style={styles.buttonContent}>
                  <Image source={require('../../assets/LogIn.png')} style={styles.icon} />
                  <Text style={styles.buttonText}>Iniciar Sesión</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Image
            source={require('../../assets/firefigther_welcome1.png')}
            style={styles.firefighterImage}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E47248',
  },
  backgroundPattern: {
    flex: 1,
    width: '100%',
  },
  content: {
    flex: 1,
  },
  textContainer: {
    paddingTop: 55,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  darkCard: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: '45%',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    paddingTop: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingBottom: 40,
  },
  description: {
    fontSize: 17,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 65,
    lineHeight: 24,
    marginBottom: 40,
  },
  firefighterImage: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: '40%',
    width: width * 0.4,
    height: height * 0.28,
    zIndex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 80,
  },
  button: {
    backgroundColor: '#E47248',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#FFFFFF',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default WelcomeScreen;
