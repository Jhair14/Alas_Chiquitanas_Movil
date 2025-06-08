import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, Image, Text,
  TouchableOpacity, Animated, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import BottomBar from '../components/BottomBar';
import { useQuery } from '@apollo/client';
import { GET_TODOS_LOS_REPORTES } from '../lib/graphql/auth';

// Types

type FireData = {
  latitude: number;
  longitude: number;
  temperature: number;
};

type Nivel = 'Alta' | 'Media' | 'Baja';

type ReporteAPI = {
  id: string;
  nombre_lugar: string;
  gravedad_incendio: string;
  comentario_adicional?: string;
  ubicacion: {
    coordinates: [number, number];
  };
};

type ReporteIncendio = {
  id: string;
  latitude: number;
  longitude: number;
  nombreLugar: string;
  nivel: Nivel;
  descripcion: string;
};

const normalizeNivel = (gravedad: string): Nivel => {
  const g = gravedad.toLowerCase();
  if (g.includes('alto')) return 'Alta';
  if (g.includes('medio') || g.includes('mediano')) return 'Media';
  return 'Baja';
};

const getColorForNivel = (nivel: Nivel): string => {
  switch (nivel) {
    case 'Alta': return 'red';
    case 'Media': return 'orange';
    case 'Baja': return 'green';
    default: return 'gray';
  }
};

const MAP_URL = (daysAgo: number) =>
  `https://firms.modaps.eosdis.nasa.gov/api/country/csv/7322196caa5d1420a30a49051bf97df2/VIIRS_SNPP_NRT/BOL/${daysAgo}/2025-04-04`;

const MapScreen = () => {
  const [fireLocations, setFireLocations] = useState<FireData[]>([]);
  const [reportes, setReportes] = useState<ReporteIncendio[]>([]);
  const [selectedFire, setSelectedFire] = useState<FireData | null>(null);
  const [selectedReporte, setSelectedReporte] = useState<ReporteIncendio | null>(null);
  const [slideAnim] = useState(new Animated.Value(200));
  const [daysFilter, setDaysFilter] = useState(1);
  const [sideCardExpanded, setSideCardExpanded] = useState(false);
  const [sideCardAnim] = useState(new Animated.Value(-120));

  const { data } = useQuery(GET_TODOS_LOS_REPORTES);

  useEffect(() => {
    if (data && data.obtenerReportes) {
      const mapped: ReporteIncendio[] = data.obtenerReportes
        .filter((r: ReporteAPI) => r.ubicacion?.coordinates?.length === 2)
        .map((r: ReporteAPI) => ({
          id: r.id,
          nombreLugar: r.nombre_lugar,
          descripcion: r.comentario_adicional || 'Sin descripción',
          nivel: normalizeNivel(r.gravedad_incendio),
          latitude: r.ubicacion.coordinates[1],
          longitude: r.ubicacion.coordinates[0],
        }));
      setReportes(mapped);
    }
  }, [data]);

  useEffect(() => {
    fetchFires(daysFilter);
  }, [daysFilter]);

  const fetchFires = async (daysAgo: number) => {
    try {
      const response = await fetch(MAP_URL(daysAgo));
      const data = await response.text();
      const lines = data.split('\n').slice(1);
      const fires = lines
        .map(line => line.split(','))
        .filter(fields => fields.length >= 5)
        .map(fields => ({
          latitude: parseFloat(fields[1]),
          longitude: parseFloat(fields[2]),
          temperature: parseFloat(fields[4]),
        }));
      setFireLocations(fires);
      setSelectedFire(null);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleMarkerPress = (fire: FireData) => {
    setSelectedReporte(null);
    setSelectedFire(fire);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleReportePress = (reporte: ReporteIncendio) => {
    setSelectedFire(null);
    setSelectedReporte(reporte);
    collapseSideCard();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideCard = () => {
    Animated.timing(slideAnim, {
      toValue: 200,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFire(null);
      setSelectedReporte(null);
    });
  };

  const toggleSideCard = () => {
    const toValue = sideCardExpanded ? -120 : 0;
    setSideCardExpanded(!sideCardExpanded);
    Animated.timing(sideCardAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const collapseSideCard = () => {
    setSideCardExpanded(false);
    Animated.timing(sideCardAnim, {
      toValue: -120,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleReporteFromList = (reporte: ReporteIncendio) => {
    handleReportePress(reporte);
  };

  return (
    <TouchableWithoutFeedback onPress={hideCard}>
      <View style={styles.container}>
        <MapView
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={{
            latitude: -16.366667,
            longitude: -62.033333,
            latitudeDelta: 5,
            longitudeDelta: 5,
          }}
        >
          {fireLocations.map((fire, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: fire.latitude, longitude: fire.longitude }}
              onPress={() => handleMarkerPress(fire)}
            >
              <Image source={require('../../assets/heatpoint.png')} style={styles.pin} />
            </Marker>
          ))}

          {reportes.map((reporte) => (
            <Marker
              key={`reporte-${reporte.id}`}
              coordinate={{ latitude: reporte.latitude, longitude: reporte.longitude }}
              onPress={() => handleReportePress(reporte)}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: getColorForNivel(reporte.nivel),
                  borderWidth: 2,
                  borderColor: '#fff',
                }}
              />
            </Marker>
          ))}
        </MapView>

        {selectedFire && (
          <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>🔥 Zona Detectada</Text>
            <Text style={styles.cardText}>🌡️ Temperatura: <Text style={styles.orange}>{selectedFire.temperature}°C</Text></Text>
            <Text style={styles.cardText}>🧭 Coordenadas: {selectedFire.latitude.toFixed(3)}, {selectedFire.longitude.toFixed(3)}</Text>
          </Animated.View>
        )}

        {selectedReporte && (
          <Animated.View style={[styles.card, { transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.cardTitle}>📝 Reporte ciudadano</Text>
            <Text style={styles.cardText}>📍 Zona: {selectedReporte.nombreLugar}</Text>
            <Text style={styles.cardText}>📄 Descripción: {selectedReporte.descripcion}</Text>
            <Text style={styles.cardText}>🧭 Coordenadas: {selectedReporte.latitude.toFixed(3)}, {selectedReporte.longitude.toFixed(3)}</Text>
            <Text style={styles.cardText}>🚩 Nivel: <Text style={{ color: getColorForNivel(selectedReporte.nivel), fontWeight: 'bold' }}>{selectedReporte.nivel}</Text></Text>
          </Animated.View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.filterButton} onPress={() => setDaysFilter(0)}>
            <Text style={styles.filterText}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setDaysFilter(1)}>
            <Text style={styles.filterText}>24h</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={() => setDaysFilter(7)}>
            <Text style={styles.filterText}>7 días</Text>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.sideCard, { transform: [{ translateX: sideCardAnim }] }]}>
          <View style={styles.sideCardHeader}>
            <Text style={styles.sideCardTitle}>📋 Reportes</Text>
            <Text style={styles.reportCount}>({reportes.length})</Text>
          </View>
          <ScrollView style={styles.reportsList}>
            {reportes.map((reporte) => (
              <TouchableOpacity
                key={`list-${reporte.id}`}
                style={styles.reportItem}
                onPress={() => handleReporteFromList(reporte)}
              >
                <View style={[styles.reportDot, { backgroundColor: getColorForNivel(reporte.nivel) }]} />
                <View style={styles.reportInfo}>
                  <Text style={styles.reportName} numberOfLines={1}>{reporte.nombreLugar}</Text>
                  <Text style={styles.reportLevel}>Nivel: {reporte.nivel}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <TouchableOpacity style={styles.sideCardToggle} onPress={toggleSideCard}>
          <Text style={styles.toggleArrow}>{sideCardExpanded ? '→' : '←'}</Text>
        </TouchableOpacity>

        <BottomBar />
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#282828' },
  map: { flex: 1 },
  pin: { width: 40, height: 40 },
  card: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#000',
    marginBottom: 4,
  },
  orange: { color: '#FF7F00', fontWeight: 'bold' },
  buttonsContainer: {
    position: 'absolute',
    top: 50,
    left: 10,
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 5,
  },
  filterText: {
    color: '#FF7F00',
    fontWeight: 'bold',
  },
  sideCard: {
    position: 'absolute',
    top: 120,
    bottom: 300,
    right: -120,
    width: 120,
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    paddingVertical: 8,
  },
  sideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sideCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  reportCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  reportsList: {
    flex: 1,
    paddingTop: 4,
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  reportDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
    borderWidth: 2,
    borderColor: '#fff',
  },
  reportInfo: {
    flex: 1,
  },
  reportName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000',
  },
  reportLevel: {
    fontSize: 10,
    color: '#666',
  },
  sideCardToggle: {
    position: 'absolute',
    right: 0,
    top: '50%',
    width: 24,
    height: 45,
    backgroundColor: 'white',
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  toggleArrow: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7F00',
  },
});

export default MapScreen;
