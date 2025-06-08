import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ChatOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  onAppChatPress: () => void;
  isLoggedIn: boolean;
};

const ChatOptionsModal = ({
  visible,
  onClose,
  onAppChatPress,
  isLoggedIn,
}: ChatOptionsModalProps) => {
  const handleTelegramPress = () => {
    Linking.openURL('https://t.me/+HURqAAca8zY3NGE5');
    onClose();
  };

  const handleWhatsAppPress = () => {
    Linking.openURL('https://chat.whatsapp.com/JbQKHw5hTtBHPQ7CNLtiGw');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <LinearGradient
            colors={['#1A1A1A', '#282828']}
            style={styles.container}
          >
            <Text style={styles.title}>Opciones de Chat</Text>

            <TouchableOpacity
              style={styles.button}
              onPress={handleTelegramPress}
            >
              <LinearGradient
                colors={['#0088cc', '#0099ff']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Image 
                  source={require('../../assets/telegram_icon.png')}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Chat de Telegram</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={handleWhatsAppPress}
            >
              <LinearGradient
                colors={['#25D366', '#128C7E']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Image 
                  source={require('../../assets/whatsapp_icon.png')}
                  style={styles.buttonIcon}
                />
                <Text style={styles.buttonText}>Chat de WhatsApp</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                onAppChatPress();
                onClose();
              }}
            >
              <LinearGradient
                colors={['#FF7F00', '#FFA500']}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Chat de la App</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 300,
  },
  container: {
    borderRadius: 20,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    padding: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
});

export default ChatOptionsModal;