import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ChatOptionsModal from './ChatOptionsModal';

const { width, height } = Dimensions.get('window');

type Nivel = 'Alta' | 'Media' | 'Baja';

type ReportDetailModalProps = {
  visible: boolean;
  onClose: () => void;
  onChatPress: () => void;
  report: {
    zona: string;
    nivelPeligro: Nivel;
    descripcion: string;
    fecha?: string;
    estado?: 'Activo' | 'Controlado' | 'Apagado';
    ubicacion?: {
      coordinates: [number, number];
    };
  } | null;
};

const ReportDetailModal = ({
  visible,
  onClose,
  onChatPress,
  report,
}: ReportDetailModalProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showChatOptions, setShowChatOptions] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, [visible]);

  const checkAuthStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    setIsLoggedIn(!!token);
  };

  if (!report) return null;

  const getStatusColor = () => {
    switch (report.nivelPeligro) {
      case 'Alta':
        return '#FF0000';
      case 'Media':
        return '#FFD700';
      case 'Baja':
        return '#00FF00';
      default:
        return '#999999';
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (report.nivelPeligro) {
      case 'Alta':
        return ['#8B0000', '#660000'];
      case 'Media':
        return ['#8B7500', '#665600'];
      case 'Baja':
        return ['#006400', '#004B00'];
      default:
        return ['#1A1A1A', '#1A1A1A'];
    }
  };

  const handleChatButtonPress = () => {
    if (isLoggedIn) {
      setShowChatOptions(true);
    } else {
      onChatPress(); // Navigate directly to app chat for view-only
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <LinearGradient
            colors={getGradientColors()}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.dragIndicator} />
            <ScrollView 
              style={styles.content}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.contentContainer}
              bounces={true}
              alwaysBounceVertical={true}
            >
              <View style={styles.header}>
                <View style={styles.spacer} />
                <TouchableOpacity onPress={handleChatButtonPress} style={styles.chatButton}>
                  <Image 
                    source={require('../../assets/chat_icon.png')} 
                    style={styles.chatIcon} 
                  />
                </TouchableOpacity>
                <View style={styles.spacer} />
              </View>

              <Text style={styles.title}>{report.zona}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Nivel de Peligro:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                  <Text style={styles.statusText}>{report.nivelPeligro}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Estado:</Text>
                <Text style={styles.value}>{report.estado || 'No especificado'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Fecha:</Text>
                <Text style={styles.value}>{report.fecha || 'No especificada'}</Text>
              </View>

              {report.ubicacion?.coordinates && (
                <View style={styles.mapContainer}>
                  <Text style={styles.label}>Ubicación:</Text>
                  <View style={styles.mapWrapper}>
                    <MapView
                      provider={PROVIDER_DEFAULT}
                      style={styles.map}
                      initialRegion={{
                        latitude: report.ubicacion.coordinates[1],
                        longitude: report.ubicacion.coordinates[0],
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }}
                    >
                      <Marker
                        coordinate={{
                          latitude: report.ubicacion.coordinates[1],
                          longitude: report.ubicacion.coordinates[0],
                        }}
                      >
                        <View style={[styles.markerPin, { backgroundColor: getStatusColor() }]} />
                      </Marker>
                    </MapView>
                  </View>
                  <View style={styles.coordinatesContainer}>
                    <Text style={styles.coordinatesText}>
                      Latitud: {report.ubicacion.coordinates[1].toFixed(6)}°
                    </Text>
                    <Text style={styles.coordinatesText}>
                      Longitud: {report.ubicacion.coordinates[0].toFixed(6)}°
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.descriptionContainer}>
                <Text style={styles.label}>Descripción:</Text>
                <Text style={styles.description}>{report.descripcion}</Text>
              </View>
            </ScrollView>
          </LinearGradient>
        </Pressable>
      </Pressable>

      <ChatOptionsModal
        visible={showChatOptions}
        onClose={() => setShowChatOptions(false)}
        onAppChatPress={onChatPress}
        isLoggedIn={isLoggedIn}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    width: '100%',
  },
  container: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: height * 0.6,
    padding: 20,
    paddingBottom: 30,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  spacer: {
    width: 40,
  },
  chatButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatIcon: {
    width: 28,
    height: 28,
    tintColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 25,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'right',
  },
  statusBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  descriptionContainer: {
    marginTop: 20,
  },
  description: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 8,
    lineHeight: 24,
  },
  mapContainer: {
    marginTop: 10,
    marginBottom: 20,
  },
  mapWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  map: {
    width: '100%',
    height: 180,
  },
  markerPin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  coordinatesContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
  },
  coordinatesText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default ReportDetailModal;