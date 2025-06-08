
import React, { createContext, useState, ReactNode } from 'react';
import { RootStackParamList } from '../navigation/types';

type Screen = keyof RootStackParamList;

export interface AppContextType {
  screen: Screen;
  params?: RootStackParamList[Screen];
  navigate: <T extends Screen>(screen: T, params?: RootStackParamList[T]) => void;
}

export const AppContext = createContext<AppContextType>({
  screen: 'Welcome',
  navigate: () => {},
});

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [screen, setScreen] = useState<Screen>('Welcome');
  const [params, setParams] = useState<any>(undefined);

  const navigate = (newScreen: Screen, newParams?: any) => {
    setScreen(newScreen);
    setParams(newParams);
  };

  return (
    <AppContext.Provider value={{ screen, params, navigate }}>
      {children}
    </AppContext.Provider>
  );
};
