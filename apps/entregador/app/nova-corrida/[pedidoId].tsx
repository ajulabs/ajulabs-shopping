import { useLocalSearchParams } from 'expo-router';
import { NovaCorridaScreen } from '../../src/features/entregador/nova-corrida';

export default function NovaCorridaRoute() {
  const { pedidoId } = useLocalSearchParams<{ pedidoId: string }>();
  return <NovaCorridaScreen pedidoId={pedidoId} />;
}
