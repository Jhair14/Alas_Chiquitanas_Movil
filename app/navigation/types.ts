export type RootStackParamList = {
  Welcome: undefined;
  LogIn: undefined;
  Home: { email: string; rol: string };
  Map: undefined;
  Chat: {
    zona: string;
    nivelPeligro: string;
    descripcion: string;
    estado: 'Activo' | 'Controlado' | 'Apagado';
  };
};
