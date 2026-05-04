import { View } from 'react-native';
import { router } from 'expo-router';
import { SplashConsumer } from '../src/features/consumer/splash';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000933' }}>
      <SplashConsumer
        onDone={() => router.replace('/(consumer)/chat')}
      />
    </View>
  );
}