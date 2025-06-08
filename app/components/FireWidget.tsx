import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Nivel = 'Alta' | 'Media' | 'Baja';

type Props = {
  zona: string;
  nivelPeligro: Nivel;
  descripcion?: string;
  onPress?: () => void;
};

const FireWidget = ({
  zona,
  nivelPeligro,
  descripcion = 'Sin descripción',
  onPress,
}: Props) => {
  const getGradientColors = (): [string, string] => {
    switch (nivelPeligro) {
      case 'Alta':
        return ['#FF0000', '#FF7F00'];
      case 'Media':
        return ['#FFD700', '#FFA500']; 
      case 'Baja':
        return ['#009E60', '#00C87A'];
      default:
        return ['#CCCCCC', '#CCCCCC'];
    }
  };

  const getEstadoColor = () => {
    switch (nivelPeligro) {
      case 'Alta':
        return '#FF4500';
      case 'Media':
        return '#FFA500';
      case 'Baja':
        return '#00C851';
      default:
        return '#CCCCCC';
    }
  };

  const getEstadoIcon = () => {
    switch (nivelPeligro) {
      case 'Alta':
        return '🔥';
      case 'Media':
        return '⚠️';
      case 'Baja':
        return '✅';
      default:
        return '❓';
    }
  };

  const getEstadoLabel = () => {
    switch (nivelPeligro) {
      case 'Alta':
        return 'Activo';
      case 'Media':
        return 'Controlado';
      case 'Baja':
        return 'Apagado';
      default:
        return 'Desconocido';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        marginBottom: 16,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ padding: 16 }}
      >
        <View style={{ marginBottom: 10 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
            {zona.charAt(0).toUpperCase() + zona.slice(1)}
          </Text>
          <Text style={{ fontSize: 14, color: 'white' }}>
            Nivel de Peligro: {nivelPeligro}
          </Text>
          <Text style={{ fontSize: 14, color: 'white' }}>
            Descripción: {descripcion}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              marginRight: 16,
              backgroundColor: getEstadoColor(),
            }}
          />
          <Text style={{ fontSize: 16, color: 'white' }}>
            {nivelPeligro} / {getEstadoLabel()} {getEstadoIcon()}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default FireWidget;
