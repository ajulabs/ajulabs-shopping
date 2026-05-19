// app/(consumer)/vitrine/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { VitrineDetail } from '../../../src/features/consumer/vitrine-detail';
import { useTheme } from '../../../src/hooks';

export default function VitrineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isDark } = useTheme();

  return <VitrineDetail lojaId={id} dark={isDark} />;
}
