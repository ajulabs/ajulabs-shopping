import { View, Text } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useDashboardC } from '../../lib/dashboardTheme';

const C = {
  border: '#E2E8F0',
  text: '#0F172A',
  sub: '#64748B',
  green: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  slate: '#64748B',
};

export function DonutChart({
  saudavel,
  atencao,
  critico,
  zerado,
  total,
  size = 180,
  strokeWidth = 24,
}: {
  saudavel: number;
  atencao: number;
  critico: number;
  zerado: number;
  total: number;
  size?: number;
  strokeWidth?: number;
}) {
  const c = useDashboardC();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { value: saudavel, color: C.green },
    { value: atencao, color: C.amber },
    { value: critico, color: C.red },
    { value: zerado, color: C.slate },
  ].filter((s) => s.value > 0);

  if (total === 0) {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={c.border} strokeWidth={strokeWidth} />
        </Svg>
        <View style={{ position: 'absolute', alignItems: 'center' }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: c.text }}>0</Text>
          <Text style={{ fontSize: 12, color: c.sub, fontWeight: '600' }}>produtos</Text>
        </View>
      </View>
    );
  }

  let accumulated = 0;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${cx}, ${cy}`}>
          {segments.map((seg, i) => {
            const segLen = (seg.value / total) * circumference;
            const offset = circumference - accumulated;
            const gap = segments.length > 1 ? 4 : 0;
            accumulated += segLen;
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(0, segLen - gap)} ${circumference - segLen + gap}`}
                strokeDashoffset={offset}
              />
            );
          })}
        </G>
      </Svg>
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontSize: 38, fontWeight: '900', color: c.text, letterSpacing: -2 }}>
          {total}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontWeight: '700',
            color: c.sub,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          produtos
        </Text>
      </View>
    </View>
  );
}
