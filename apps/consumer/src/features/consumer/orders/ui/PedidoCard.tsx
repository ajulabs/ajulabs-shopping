import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedido, StatusPedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';

const STATUS_CONFIG: Record<StatusPedido, { label: string; icon: string; color: string; bg: string }> = {
  aguardando:    { label: 'Aguardando',     icon: 'time-outline',       color: colors.n600,    bg: colors.n100 },
  confirmado:    { label: 'Confirmado',     icon: 'checkmark-circle',   color: '#185FA5',      bg: '#E6F1FB' },
  preparando:    { label: 'Preparando',     icon: 'restaurant-outline', color: '#854F0B',      bg: '#FAEEDA' },
  pronto:        { label: 'Pronto',         icon: 'bag-check-outline',  color: '#2D6A2D',      bg: '#E6F4E6' },
  saiu_entrega:  { label: 'A caminho',      icon: 'bicycle-outline',    color: colors.orange600, bg: colors.orange100 },
  entregue:      { label: 'Entregue',       icon: 'checkmark-done',     color: colors.mintText,  bg: 'rgba(57,255,137,0.15)' },
  cancelado:     { label: 'Cancelado',      icon: 'close-circle',       color: '#A32D2D',      bg: '#FCEBEB' },
};

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Agora';
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h atrás`;
  const d = Math.floor(h / 24);
  return `${d}d atrás`;
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

interface Props {
  pedido: Pedido;
  onPress: (id: string) => void;
  isDark?: boolean;
}

export function PedidoCard({ pedido, onPress, isDark = false }: Props) {
  const cfg = STATUS_CONFIG[pedido.status];
  const isAtivo = !['entregue', 'cancelado'].includes(pedido.status);

  const surf    = isDark ? colors.surfDark : colors.n0;
  const border  = isDark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const borderL = isDark ? 'rgba(255,255,255,0.05)' : colors.n100;
  const text    = isDark ? colors.n0      : colors.navy;
  const textSec = isDark ? 'rgba(255,255,255,0.45)' : colors.n500;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: surf, borderColor: isAtivo ? colors.orange : border },
        isAtivo && styles.cardAtivo,
      ]}
      onPress={() => onPress(pedido.id)}
      activeOpacity={0.8}
    >
      <View style={styles.topo}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.loja, { color: text }]}>{pedido.lojaNome}</Text>
          <Text style={[styles.tempo, { color: textSec as string }]}>{tempoRelativo(pedido.criadoEm)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.itensRow}>
        <Text style={[styles.itensQtd, { color: textSec as string }]}>
          {pedido.itens.reduce((a, i) => a + i.quantidade, 0)} {pedido.itens.length === 1 ? 'item' : 'itens'}
        </Text>
        <Text style={[styles.totalTxt, { color: text }]}>{fmt(pedido.total)}</Text>
      </View>

      {isAtivo && pedido.estimativaEntrega && (
        <View style={[styles.etaRow, { borderTopColor: borderL }]}>
          <Ionicons name="time-outline" size={14} color={colors.orange} />
          <Text style={styles.etaTxt}>
            Chega em ~{Math.max(1, Math.ceil((new Date(pedido.estimativaEntrega).getTime() - Date.now()) / 60000))} min
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card:       { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardAtivo:  { borderWidth: 1.5 },

  topo:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loja:       { fontSize: 15, fontWeight: '700' },
  tempo:      { fontSize: 11.5, marginTop: 2 },

  badge:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  badgeTxt:   { fontSize: 11, fontWeight: '600' },

  itensRow:   { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  itensQtd:   { fontSize: 13 },
  totalTxt:   { fontSize: 14, fontWeight: '700' },

  etaRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
                paddingTop: 10, borderTopWidth: 1 },
  etaTxt:     { fontSize: 12, fontWeight: '600', color: colors.orange },
});
