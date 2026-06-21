import { useLocalSearchParams } from 'expo-router';
import { ChatPedidoScreen } from '../../../src/features/lojista/pedidos';

export default function ChatPedidoRoute() {
  const { pedidoId, destinatario } = useLocalSearchParams<{
    pedidoId: string;
    destinatario?: string;
  }>();
  return <ChatPedidoScreen pedidoId={pedidoId} destinatario={destinatario} />;
}
