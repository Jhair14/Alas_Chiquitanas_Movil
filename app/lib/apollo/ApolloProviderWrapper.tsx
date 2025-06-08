import React, { useEffect, useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

export default function ApolloProviderWrapper({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<ApolloClient<any> | null>(null);

  const createClient = async () => {
    const token = await AsyncStorage.getItem('token');
    const httpLink = new HttpLink({ uri: 'http://34.28.246.100:4000/graphql' });

    const authLink = setContext((_, { headers }) => ({
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }));

    const newClient = new ApolloClient({
      link: from([authLink, httpLink]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: { fetchPolicy: 'no-cache' },
        query: { fetchPolicy: 'no-cache' },
      },
    });

    setClient(newClient);
  };

  useEffect(() => {
    createClient();

    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') createClient(); 
    });

    return () => subscription.remove();
  }, []);

  if (!client) return null;

  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}
