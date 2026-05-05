// app/(consumer)/vitrine/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { VitrineDetail } from '../../../src/features/consumer/vitrine-detail';

export default function VitrineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <VitrineDetail lojaId={id} />;
}