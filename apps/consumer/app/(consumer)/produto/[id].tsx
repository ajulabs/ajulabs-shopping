import { useLocalSearchParams } from 'expo-router';
import { ProdutoDetail } from '../../../src/features/consumer/produto-detail';

export default function ProdutoDetailRoute() {
  const { id, quantidade } = useLocalSearchParams<{ id: string; quantidade?: string }>();
  const quantidadeInicial = quantidade
    ? Math.min(Math.max(parseInt(quantidade), 1), 99)
    : undefined;
  return <ProdutoDetail produtoId={id} quantidadeInicial={quantidadeInicial} />;
}
