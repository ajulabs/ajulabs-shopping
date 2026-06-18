import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedido, StatusPedido } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';

const STATUS_CONFIG: Record<
  StatusPedido,
  { label: string; icon: string; color: string; bg: string }
> = {
  aguardando: { label: 'Aguardando', icon: 'time-outline', color: colors.n600, bg: colors.n100 },
  confirmado: { label: 'Confirmado', icon: 'checkmark-circle', color: '#185FA5', bg: '#E6F1FB' },
  preparando: { label: 'Preparando', icon: 'restaurant-outline', color: '#854F0B', bg: '#FAEEDA' },
  pronto: { label: 'Pronto', icon: 'bag-check-outline', color: '#2D6A2D', bg: '#E6F4E6' },
  saiu_entrega: {
    label: 'A caminho',
    icon: 'bicycle-outline',
    color: colors.orange600,
    bg: colors.orange100,
  },
  entregue: {
    label: 'Entregue',
    icon: 'checkmark-done',
    color: colors.mintText,
    bg: 'rgba(57,255,137,0.15)',
  },
  cancelado: { label: 'Cancelado', icon: 'close-circle', color: '#A32D2D', bg: '#FCEBEB' },
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
}

export function PedidoCard({ pedido, onPress }: Props) {
  const cfg = STATUS_CONFIG[pedido.status];
  const isAtivo = !['entregue', 'cancelado'].includes(pedido.status);
  const precisaAvaliar = pedido.status === 'entregue' && !pedido.avaliado;

  const { surf, border, borderL, text, textSec } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: surf,
          borderColor: isAtivo ? colors.orange : precisaAvaliar ? '#F59E0B' : border,
        },
        isAtivo && styles.cardAtivo,
      ]}
      onPress={() => onPress(pedido.id)}
      activeOpacity={0.8}
    >
      <View style={styles.topo}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.loja, { color: text }]}>{pedido.lojaNome}</Text>
          <Text style={[styles.tempo, { color: textSec as string }]}>
            {tempoRelativo(pedido.criadoEm)}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Ionicons name={cfg.icon as any} size={12} color={cfg.color} />
          <Text style={[styles.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>

      <View style={styles.itensRow}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={[styles.itensNomes, { color: textSec as string }]} numberOfLines={2}>
            {pedido.itens
              .map((i) =>
                i.quantidade > 1 ? `${i.quantidade}× ${i.produto.nome}` : i.produto.nome,
              )
              .join(', ')}
          </Text>
        </View>
        <Text style={[styles.totalTxt, { color: text }]}>{fmt(pedido.total)}</Text>
      </View>

      {isAtivo && pedido.estimativaEntrega && (
        <View style={[styles.etaRow, { borderTopColor: borderL }]}>
          <Ionicons name="time-outline" size={14} color={colors.orange} />
          <Text style={styles.etaTxt}>
            Chega em ~
            {Math.max(
              1,
              Math.ceil((new Date(pedido.estimativaEntrega).getTime() - Date.now()) / 60000),
            )}{' '}
            min
          </Text>
        </View>
      )}

      {precisaAvaliar && (
        <View style={[styles.avaliarRow, { borderTopColor: borderL }]}>
          <Ionicons name="star-outline" size={13} color="#F59E0B" />
          <Text style={styles.avaliarTxt}>Toque para avaliar este pedido</Text>
          <Ionicons name="chevron-forward" size={13} color="#F59E0B" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1 },
  cardAtivo: { borderWidth: 1.5 },

  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  loja: { fontSize: 15, fontWeight: '700' },
  tempo: { fontSize: 11.5, marginTop: 2 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeTxt: { fontSize: 11, fontWeight: '600' },

  itensRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
  },
  itensNomes: { fontSize: 12.5, lineHeight: 17 },
  totalTxt: { fontSize: 14, fontWeight: '700' },

  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  etaTxt: { fontSize: 12, fontWeight: '600', color: colors.orange },

  avaliarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  avaliarTxt: { fontSize: 12, fontWeight: '600', color: '#F59E0B', flex: 1 },
});
