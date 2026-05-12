import { useThemeStore } from '../../src/store';
import { VitrinesList } from '../../src/features/consumer/vitrines';

export default function VitrinasScreen() {
  const isDark = useThemeStore(s => s.isDark);
  return <VitrinesList dark={isDark} />;
}
