import { useLocalSearchParams } from 'expo-router';
import { ProdutoDetail } from '../../../src/features/consumer/produto-detail';

export default function ProdutoDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProdutoDetail produtoId={id} />;
}
