import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  useEffect(() => {
    // Por enquanto vai direto pro consumer
    // Quando tiver auth, aqui vai checar se é lojista ou consumidor
    router.replace('/(lojista)');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000933' }}>
      <ActivityIndicator color="#F2760F" size="large" />
    </View>
  );
}