import React, { useContext, useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useLazyQuery } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { AppContext } from '../context/AppContext';
import { GET_TODOS_LOS_REPORTES } from '../lib/graphql/auth';
import FireWidget from '../components/FireWidget';
import BottomBar from '../components/BottomBar';
import ReportDetailModal from '../components/ReportDetailModal';
import { useWidget } from '../hooks/useWidget';

const { width } = Dimensions.get('window');

type Nivel = 'Alta' | 'Media' | 'Baja';

type Reporte = {
  id: string;
  zona: string;
  nivelPeligro: Nivel;
  descripcion: string;
  ubicacion?: {
    coordinates: [number, number];
  };
};

type ReporteAPI = {
  id: string;
  nombre_lugar: string;
  gravedad_incendio: string;
  comentario_adicional?: string;
  ubicacion: {
    coordinates: [number, number];
  };
};

type ReporteDetallado = {
  zona: string;
  nivelPeligro: Nivel;
  descripcion: string;
  fecha?: string;
  estado?: 'Activo' | 'Controlado' | 'Apagado';
  entidad_responsable?: string;
};

const normalizeNivel = (gravedad: string): Nivel => {
  const g = gravedad.toLowerCase();
  if (g.includes('alto')) return 'Alta';
  if (g.includes('medio') || g.includes('mediano')) return 'Media';
  return 'Baja';
};

const HomeScreen = () => {
  const { navigate } = useContext(AppContext);
  const [authorized, setAuthorized] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Nivel[]>([]);
  const [selectedReport, setSelectedReport] = useState<Reporte | null>(null);
  const { updateWidget } = useWidget();

  
  const [switchAnimations] = useState({
    Alta: new Animated.Value(0),
    Media: new Animated.Value(0),
    Baja: new Animated.Value(0),
  });

  const [fetchReportes, { data, loading, error }] = useLazyQuery(GET_TODOS_LOS_REPORTES, {
    fetchPolicy: 'network-only',
    onError: (err) => {
      console.log('❌ Error al obtener reportes:', JSON.stringify(err, null, 2));
    },
  });

  useEffect(() => {
    const checkTokenAndFetch = async () => {
      const token = await AsyncStorage.getItem('token');
      setAuthorized(!!token);
      setTokenChecked(true);
      fetchReportes();
    };
    checkTokenAndFetch();
  }, []);

  useEffect(() => {
    if (data && data.obtenerReportes) {
      const mapped = data.obtenerReportes
        .filter((r: ReporteAPI) => r.ubicacion?.coordinates?.length === 2)
        .map((r: ReporteAPI) => ({
          id: r.id,
          zona: r.nombre_lugar,
          nivelPeligro: normalizeNivel(r.gravedad_incendio),
          descripcion: r.comentario_adicional || 'Sin descripción',
          ubicacion: r.ubicacion,
        }));
      
      
      const activeFires = mapped.filter((r: Reporte) => r.nivelPeligro === 'Alta').length;
      updateWidget(activeFires, mapped.length);
    }
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReportes();
    } catch (err) {
      console.log('❌ Error al refrescar reportes:', err);
    }
    setRefreshing(false);
  };

  const toggleFilter = (nivel: Nivel) => {
    setActiveFilters(prev => {
      const isActive = prev.includes(nivel);
      
      Animated.spring(switchAnimations[nivel], {
        toValue: isActive ? 0 : 1,
        useNativeDriver: true,
      }).start();
      return isActive ? prev.filter(f => f !== nivel) : [...prev, nivel];
    });
  };

  const filterReportes = (reportes: Reporte[]): Reporte[] => {
    let filtered = reportes;
    
    
    if (activeFilters.length > 0) {
      filtered = filtered.filter(reporte => activeFilters.includes(reporte.nivelPeligro));
    }

    
    if (searchQuery) {
      const searchText = searchQuery.toLowerCase();
      filtered = filtered.filter(reporte => 
        reporte.zona.toLowerCase().includes(searchText) ||
        reporte.descripcion.toLowerCase().includes(searchText)
      );
    }

    return filtered;
  };

  const renderReportes = (): Reporte[] => {
    const reales = (data?.obtenerReportes || [])
      .filter((item: unknown): item is ReporteAPI =>
        typeof item === 'object' &&
        item !== null &&
        'id' in item &&
        'nombre_lugar' in item &&
        'gravedad_incendio' in item
      )
      .map((r: ReporteAPI): Reporte => ({
        id: `real-${r.id}`,
        zona: r.nombre_lugar,
        nivelPeligro: normalizeNivel(r.gravedad_incendio),
        descripcion: r.comentario_adicional || 'Sin comentarios',
        ubicacion: r.ubicacion,
      }))
      .sort((a: Reporte, b: Reporte) => {
        const prioridad: Record<Nivel, number> = { Alta: 0, Media: 1, Baja: 2 };
        return prioridad[a.nivelPeligro] - prioridad[b.nivelPeligro];
      });

    return filterReportes(reales);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario_nombre');
    await AsyncStorage.removeItem('usuario_id');
    await AsyncStorage.removeItem('usuario_entidad');
    setAuthorized(false);
    navigate('Welcome');
  };

  const renderFilterSwitch = (nivel: Nivel) => {
    const isActive = activeFilters.includes(nivel);
    const getBackgroundColor = () => {
      switch (nivel) {
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

    const translateX = switchAnimations[nivel].interpolate({
      inputRange: [0, 1],
      outputRange: [2, 22]
    });

    return (
      <View style={styles.filterSwitchContainer}>
        <Text style={styles.filterLabel}>{nivel}</Text>
        <TouchableOpacity
          style={[
            styles.switchTrack,
            { backgroundColor: isActive ? getBackgroundColor() : '#333333' }
          ]}
          onPress={() => toggleFilter(nivel)}
          activeOpacity={0.8}
        >
          <Animated.View
            style={[
              styles.switchThumb,
              { transform: [{ translateX }] }
            ]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (!tokenChecked || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF7F00" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Incendios Reportados</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar reportes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.searchIcon}>
          <Image source={require('../../assets/lupa.png')} style={styles.icon} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        {renderFilterSwitch('Alta')}
        {renderFilterSwitch('Media')}
        {renderFilterSwitch('Baja')}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF7F00']}
            tintColor="#FF7F00"
          />
        }
      >
        {error && (
          <View style={styles.centered}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>Error al cargar los reportes</Text>
          </View>
        )}

        {renderReportes().map((r: Reporte) => (
          <FireWidget
            key={r.id}
            zona={r.zona}
            nivelPeligro={r.nivelPeligro}
            descripcion={r.descripcion}
            onPress={() => setSelectedReport(r)}
          />
        ))}
      </ScrollView>

      <ReportDetailModal
        visible={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        onChatPress={() => {
          if (selectedReport) {
            navigate('Chat', {
              zona: selectedReport.zona,
              nivelPeligro: selectedReport.nivelPeligro,
              descripcion: selectedReport.descripcion,
              estado:
                selectedReport.nivelPeligro === 'Alta'
                  ? 'Activo'
                  : selectedReport.nivelPeligro === 'Media'
                  ? 'Controlado'
                  : 'Apagado',
            });
            setSelectedReport(null);
          }
        }}
        report={selectedReport ? {
          zona: selectedReport.zona,
          nivelPeligro: selectedReport.nivelPeligro,
          descripcion: selectedReport.descripcion,
          fecha: new Date().toLocaleDateString(),
          estado: selectedReport.nivelPeligro === 'Alta'
            ? 'Activo'
            : selectedReport.nivelPeligro === 'Media'
            ? 'Controlado'
            : 'Apagado',
          ubicacion: selectedReport.ubicacion,
        } : null}
      />

      <BottomBar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: '#1A1A1A',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333333',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  searchIcon: {
    padding: 10,
  },
  icon: {
    width: 20,
    height: 20,
    tintColor: '#999',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  filterSwitchContainer: {
    alignItems: 'center',
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  switchTrack: {
    width: 50,
    height: 26,
    borderRadius: 13,
    padding: 2,
  },
  switchThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default HomeScreen;