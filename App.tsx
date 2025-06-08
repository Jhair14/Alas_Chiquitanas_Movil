import React from 'react';
import { View, StatusBar } from 'react-native';
import ApolloProviderWrapper from './app/lib/apollo/ApolloProviderWrapper';
import { AppProvider } from './app/context/AppContext';
import AppNavigator from './app/navigation/AppNavigator';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1A1A1A' }}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <ApolloProviderWrapper>
        <AppProvider>
          <AppNavigator />
        </AppProvider>
      </ApolloProviderWrapper>
    </View>
  );
}
