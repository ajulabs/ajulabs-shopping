import { PedidosScreen } from '../../src/features/lojista/pedidos';
import { useDoubleBackExit } from '../../src/shared/hooks';

export default function PedidosRoute() {
  useDoubleBackExit();
  return <PedidosScreen />;
}
