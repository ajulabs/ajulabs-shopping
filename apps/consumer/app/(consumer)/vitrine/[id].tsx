// app/(consumer)/vitrine/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { VitrineDetail } from '../../../src/features/consumer/vitrine-detail';
import { useThemeStore } from '../../../src/store';

export default function VitrineDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useThemeStore(s => s.isDark);

  return <VitrineDetail lojaId={id} dark={isDark} />;
}
