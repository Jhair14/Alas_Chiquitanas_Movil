import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { AppContext } from '../context/AppContext';
import client from '../lib/apollo/client';
import { AUTENTICAR_USUARIO, OBTENER_USUARIO } from '../lib/graphql/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { navigate } = useContext(AppContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [userData, setUserData] = useState<any>(null);

  const handleLogin = async () => {
    if (usuario.trim() === '' || password.trim() === '') {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const { data: loginData } = await client.mutate({
        mutation: AUTENTICAR_USUARIO,
        variables: {
          input: {
            ci: usuario,
            password: password,
          },
        },
      });

      const token = loginData?.autenticarUsuario?.token;
      if (!token) {
        alert('Credenciales incorrectas');
        return;
      }

      await AsyncStorage.setItem('token', token);

      const { data: userDataResponse } = await client.query({
        query: OBTENER_USUARIO,
        variables: { token },
      });

      const user = userDataResponse?.obtenerUsuario;
      setUserData(userDataResponse);

      if (user) {
        // Save individual fields (optional, for backward compatibility)
        await AsyncStorage.setItem('usuario_nombre', user.nombre);
        await AsyncStorage.setItem('usuario_id', user.id);
        if (user.entidad_perteneciente) {
          await AsyncStorage.setItem('usuario_entidad', user.entidad_perteneciente);
        }
        // Save the whole user object for easy access later
        await AsyncStorage.setItem('usuario_objeto', JSON.stringify(user));

        const welcomePrefix = user.genero === 'Femenino' ? 'Bienvenida' : 'Bienvenido';
        setMensajeExito(`${welcomePrefix}, ${user.nombre}`);
        setModalVisible(true);

        setTimeout(() => {
          setModalVisible(false);
          navigate('Home', { email: user.email, rol: user.rol });
        }, 2000);
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message || 'No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ImageBackground
        source={require('../../assets/fire_pattern.jpg')}
        style={styles.backgroundPattern}
        imageStyle={{ opacity: 0.35 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.content}>
            <View style={styles.formContainer}>
              <Image
                source={require('../../assets/firefigther_welcome1.png')}
                style={styles.firefighterImage}
                resizeMode="contain"
              />
              <Text style={styles.title}>INICIAR SESIÓN</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Carnet de Identidad:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Carnet"
                  placeholderTextColor="#999"
                  keyboardType="default"
                  autoCapitalize="none"
                  value={usuario}
                  onChangeText={setUsuario}
                />

                <Text style={styles.label}>Contraseña:</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />

                <TouchableOpacity
                  style={styles.button}
                  activeOpacity={0.8}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Iniciar Sesión</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.guestContainer}>
                  <Text style={styles.guestText}>
                    Quieres continuar como invitado?
                  </Text>
                  <TouchableOpacity onPress={() => navigate('Welcome')}>
                    <Text style={styles.linkText}>Haz Click Aquí</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <LinearGradient 
              colors={['#E47248', '#E47248']} 
              style={styles.successModal}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalIconContainer}>
                <Image
                  source={
                    userData?.obtenerUsuario?.genero === 'Femenino'
                      ? require('../../assets/female_firefighter.png')
                      : require('../../assets/male_firefighter.png')
                  }
                  style={styles.modalIcon}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.successTitle}>¡Éxito!</Text>
              <Text style={styles.successText}>{mensajeExito}</Text>
            </LinearGradient>
          </View>
        </Modal>
      </ImageBackground>
    </KeyboardAvoidingView>
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
  scroll: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    flex: 1,
    marginTop: height * 0.15,
    position: 'relative',
  },
  firefighterImage: {
    position: 'absolute',
    right:-20,
    top: -height * 0.1,
    width: width * 0.5,
    height: width * 0.6,
  },
  title: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 40,
    maxWidth: '60%',
    marginTop: height * 0.1,
  },
  inputContainer: {
    paddingTop: 10,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#333333',
    color: '#FFFFFF',
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 25,
    fontSize: 18,
  },
  button: {
    backgroundColor: '#E47248',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginTop: height * 0.05,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  guestContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  guestText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 5,
  },
  linkText: {
    color: '#E47248',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  successModal: {
    padding: 25,
    borderRadius: 20,
    alignItems: 'center',
    width: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalIcon: {
    width: 50,
    height: 50,
    tintColor: '#FFFFFF',
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  successText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default LoginScreen;
