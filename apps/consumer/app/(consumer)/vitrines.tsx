import { useTheme } from '../../src/shared/hooks';
import { VitrinesList } from '../../src/features/consumer/vitrines';

export default function VitrinasScreen() {
  const { isDark } = useTheme();
  return <VitrinesList dark={isDark} />;
}
