import { useLocalSearchParams } from 'expo-router';
import { TrackingScreen } from '../../../src/features/consumer/tracking';

export default function TrackingRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TrackingScreen pedidoId={id} />;
}