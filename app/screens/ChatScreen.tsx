import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView,
  TouchableOpacity, Image, Keyboard, Platform, SafeAreaView, KeyboardAvoidingView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppContext } from '../context/AppContext';
import { LinearGradient } from 'expo-linear-gradient';

interface Message {
  nombre: string;
  entidad?: string;
  texto: string;
  timestamp?: string;
  user_id?: string;
}

const ChatScreen = ({ zona, nivelPeligro, descripcion, estado }: {
  zona: string;
  nivelPeligro: string;
  descripcion: string;
  estado: 'Activo' | 'Controlado' | 'Apagado';
}) => {
  const { navigate } = useContext(AppContext);
  const [mensaje, setMensaje] = useState('');
  const [mensajes, setMensajes] = useState<Message[]>([]);
  const [autenticado, setAutenticado] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Conectando...');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const ws = useRef<WebSocket | null>(null);
  const isMounted = useRef(true);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const pingInterval = useRef<NodeJS.Timeout | null>(null);

  
  const WEBSOCKET_URL = 'wss://chatwebsocketi-production.up.railway.app';
  const STORAGE_KEY = `chat_mensajes_${zona}`;

  useEffect(() => {
    isMounted.current = true;
    
    const initializeChat = async () => {
      try {
       
        const token = await AsyncStorage.getItem('token');
        const nombre = await AsyncStorage.getItem('usuario_nombre');
        const entidad = await AsyncStorage.getItem('usuario_entidad');
        console.log('👤 Usuario info:', { token: !!token, nombre, entidad });
        
        
        await new Promise<void>(resolve => {
          setAutenticado(!!token);
          setTimeout(resolve, 100); 
        });
        
        if (nombre && entidad) {
          setNombreUsuario(`${nombre} (${entidad})`);
        } else if (nombre) {
          setNombreUsuario(nombre);
        }

        
        try {
          const data = await AsyncStorage.getItem(STORAGE_KEY);
          if (data) {
            setMensajes(JSON.parse(data));
          }
        } catch (error) {
          console.error('❌ Error cargando mensajes guardados:', error);
        }

       
        if (!!token) {
          console.log('🔄 Initiating WebSocket connection with auth:', { token: !!token });
          connectWebSocket();
        }
      } catch (error) {
        console.error('❌ Error initializing chat:', error);
      }
    };

    initializeChat();

    return () => {
      isMounted.current = false;
      cleanup();
    };
  }, [zona]);

  const cleanup = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    if (pingInterval.current) {
      clearInterval(pingInterval.current);
    }
    if (ws.current) {
      ws.current.close();
      ws.current = null;
    }
  };

  const connectWebSocket = () => {
    if (!isMounted.current) return;

    try {
      console.log('🔄 Connecting to WebSocket...');
      setConnectionStatus('Conectando...');
      
      ws.current = new WebSocket(WEBSOCKET_URL);

      ws.current.onopen = async () => {
        if (!isMounted.current) return;
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('Conectado');
        reconnectAttempts.current = 0;
        
        startPingInterval();
        
       
        const token = await AsyncStorage.getItem('token');
        if (token) {
          console.log('🔐 Found token, authenticating...');
          authenticateUser();
        } else {
          console.log('⚠️ No token found, skipping auth');
          setIsAuthenticated(false);
        }
      };

      ws.current.onmessage = (event) => {
        if (!isMounted.current) return;
        try {
          const data = JSON.parse(event.data);
          console.log('📨 Received:', data.type, data);
          handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      ws.current.onclose = (event) => {
        if (!isMounted.current) return;
        console.log('🔌 WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        setConnectionStatus('Desconectado');
        
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
        }

        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          reconnectAttempts.current++;
          
          console.log(`🔄 Reconnecting in ${delay}ms... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          setConnectionStatus(`Reconectando... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, delay);
        } else {
          setConnectionStatus('Sin conexión');
        }
      };

      ws.current.onerror = (error) => {
        if (!isMounted.current) return;
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('Error de conexión');
      };

    } catch (error) {
      console.error('❌ Error creating WebSocket:', error);
      setConnectionStatus('Error de conexión');
    }
  };

  const startPingInterval = () => {
    pingInterval.current = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 30000);
  };

  const authenticateUser = async () => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket not ready for authentication');
      return;
    }

    try {
      const nombre = await AsyncStorage.getItem('usuario_nombre');
      const entidad = await AsyncStorage.getItem('usuario_entidad');
      const userId = await AsyncStorage.getItem('usuario_id');

      if (!nombre || !userId) {
        console.error('❌ Missing auth data:', { nombre: !!nombre, userId: !!userId });
        setIsAuthenticated(false);
        return;
      }

      console.log('🔐 Authenticating user:', { nombre, entidad, userId });
      
      const authMessage = {
        type: 'authenticate',
        user_id: userId,
        user_name: nombre,
        entity: entidad || ''
      };

      console.log('📤 Sending auth message');
      ws.current.send(JSON.stringify(authMessage));
    } catch (error) {
      console.error('❌ Error in authenticateUser:', error);
      setIsAuthenticated(false);
    }
  };

  const handleMessage = (data: any) => {
    console.log('📨 Processing message:', data.type);
    
    switch (data.type) {
      case 'connection_established':
        console.log('✅ Connection established');
        break;
        
      case 'auth_response':
        if (data.success) {
          console.log('✅ Authentication successful');
          setIsAuthenticated(true);
          setConnectionStatus('Conectado y autenticado');
        } else {
          console.error('❌ Authentication failed:', data.message);
          setIsAuthenticated(false);
          setConnectionStatus('Error de autenticación');
        }
        break;
        
      case 'chat_history':
        console.log('📚 Received chat history');
        if (data.zone === zona) {
          setMensajes(data.messages);
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.messages));
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
        break;
        
      case 'chat_message':
        const newMessage: Message = {
          nombre: data.user_name,
          entidad: data.entity,
          texto: data.message,
          timestamp: data.timestamp,
          user_id: data.user_id
        };
        
        setMensajes((prev) => {
          const updated = [...prev, newMessage];
          // Save to AsyncStorage
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
        
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        break;
        
      case 'pong':
        
        break;
        
      case 'error':
        console.error('❌ Server error:', data.message);
        setConnectionStatus(`Error: ${data.message}`);
        break;
        
      default:
        console.log('📩 Unknown message type:', data.type);
    }
  };

  const enviarMensaje = async () => {
    if (!autenticado || mensaje.trim() === '') return;

    if (!isAuthenticated) {
      setConnectionStatus('No autenticado - reconectando...');
      if (isConnected) {
        authenticateUser();
      }
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setConnectionStatus('Sin conexión - reconectando...');
      connectWebSocket();
      return;
    }

    const nombre = await AsyncStorage.getItem('usuario_nombre');
    const entidad = await AsyncStorage.getItem('usuario_entidad');
    const userId = await AsyncStorage.getItem('usuario_id');

    const messageData = {
      type: 'chat_message',
      message: mensaje.trim(),
      user_name: nombre,
      entity: entidad,
      user_id: userId,
      zone: zona
    };

    try {
      ws.current.send(JSON.stringify(messageData));
      setMensaje('');
      Keyboard.dismiss();
    } catch (error) {
      console.error('❌ Error sending message:', error);
      setConnectionStatus('Error enviando mensaje');
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (estado) {
      case 'Activo': return ['#FF0000', '#FF7F00'];
      case 'Controlado': return ['#E3D324', '#FFF266'];
      case 'Apagado': return ['#009E60', '#00C87A'];
      default: return ['#CCCCCC', '#CCCCCC'];
    }
  };

  const getConnectionStatusColor = () => {
    if (isAuthenticated) return '#4CAF50';
    if (isConnected) return '#FF9800';
    return '#F44336';
  };

  const getConnectionStatusIcon = () => {
    if (isAuthenticated) return '●';
    if (isConnected) return '◐';
    return '○';
  };

  const retryConnection = () => {
    reconnectAttempts.current = 0;
    connectWebSocket();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.zona}>{zona}</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusIcon, { color: getConnectionStatusColor() }]}>
                {getConnectionStatusIcon()}
              </Text>
              <Text style={styles.estado}>{connectionStatus}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => navigate('Home')} style={styles.backButton}>
            <Image
              source={require('../../assets/back_arrow.png')}
              style={styles.backIcon}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={{ padding: 10, paddingBottom: 20 }}
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {mensajes.length === 0 ? (
            <Text style={{ color: '#888888', textAlign: 'center', marginTop: 20 }}>Aquí irán los mensajes del chat...</Text>
          ) : (
            mensajes.map((msg, index) => (
              <View key={index} style={styles.mensajeBurbuja}>
                <Text style={{ fontWeight: 'bold', color: '#FF7F00', marginBottom: 4 }}>
                  {msg.nombre} {msg.entidad ? `(${msg.entidad})` : ''}
                </Text>
                <Text style={{ color: '#FFFFFF', fontSize: 16 }}>{msg.texto}</Text>
                {msg.timestamp && (
                  <Text style={styles.timestamp}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>

        <View style={styles.bottomContainer}>
          {autenticado ? (
            <View style={styles.inputContainer}>
              <TextInput
                value={mensaje}
                onChangeText={setMensaje}
                placeholder="Escribe un mensaje..."
                placeholderTextColor="#999"
                style={styles.input}
                editable={isAuthenticated}
              />
              <TouchableOpacity 
                style={[
                  styles.sendButton, 
                  !isAuthenticated && styles.sendButtonDisabled
                ]} 
                onPress={enviarMensaje}
                disabled={!isAuthenticated || !mensaje.trim()}
              >
                <Image
                  source={require('../../assets/send_icon.png')}
                  style={{ width: 24, height: 24, tintColor: '#fff' }}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.viewOnlyMessage}>
              <Text style={styles.viewOnlyText}>
                Modo vista previa - Inicia sesión para participar
              </Text>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => navigate('LogIn')}
              >
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1A1A1A' 
  },
  header: {
    paddingTop: 36,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  zona: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statusIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  estado: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  backButton: {
    padding: 8,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backIcon: {
    width: 36,
    height: 36,
    tintColor: '#fff',
  },
  chatContainer: { 
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  mensajeBurbuja: {
    backgroundColor: '#333333',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#444444',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timestamp: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
  },
  bottomContainer: { 
    backgroundColor: '#1A1A1A', 
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    borderColor: '#444444',
    borderWidth: 1,
  },
  input: { 
    flex: 1, 
    paddingHorizontal: 10, 
    color: '#FFFFFF',
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FF7F00',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#444444',
  },
  viewOnlyMessage: {
    backgroundColor: '#333333',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#444444',
  },
  viewOnlyText: {
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#FF7F00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default ChatScreen;