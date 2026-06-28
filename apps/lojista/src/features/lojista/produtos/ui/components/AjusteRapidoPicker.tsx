import { useMemo } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Produto } from '@ajulabs/types';
import { calcNivel } from '../../../../../entities/produto';
import { C, NIVEL_CFG, useDashboardC, type DashboardC } from '../../lib/dashboardTheme';

export function AjusteRapidoPicker({
  visible,
  produtos,
  onClose,
  onSelect,
}: {
  visible: boolean;
  produtos: Produto[];
  onClose: () => void;
  onSelect: (p: Produto) => void;
}) {
  const c = useDashboardC();
  const s = useMemo(() => makeStyles(c), [c]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.pickerOverlay}>
        <View style={s.pickerSheet}>
          <View style={s.pickerHandle} />
          <View style={s.pickerHead}>
            <Text style={s.pickerTitle}>Qual produto ajustar?</Text>
            <TouchableOpacity style={s.pickerClose} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={16} color={c.sub} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={produtos}
            keyExtractor={(p) => p.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.pickerList}
            renderItem={({ item: p }) => {
              const nivel = calcNivel(p.estoque ?? 0, p.estoqueMinimo ?? 0);
              const cfg = NIVEL_CFG[nivel];
              return (
                <TouchableOpacity
                  style={s.pickerItem}
                  activeOpacity={0.75}
                  onPress={() => onSelect(p)}
                >
                  <View style={[s.pickerItemIcon, { backgroundColor: cfg.color + '18' }]}>
                    <Ionicons name={cfg.icon as any} size={16} color={cfg.color} />
                  </View>
                  <Text style={s.pickerItemNome} numberOfLines={1}>
                    {p.nome}
                  </Text>
                  <View style={[s.pickerItemBadge, { backgroundColor: cfg.color }]}>
                    <Text style={s.pickerItemQty}>{p.estoque ?? 0}</Text>
                    <Text style={s.pickerItemUnit}>un</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={c.mute} />
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function makeStyles(c: DashboardC) {
  return StyleSheet.create({
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
    pickerSheet: {
      backgroundColor: c.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 20,
      paddingBottom: 44,
      maxHeight: '80%',
      borderTopWidth: 1,
      borderColor: c.border,
    },
    pickerHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.border,
      alignSelf: 'center',
      marginTop: 12,
      marginBottom: 18,
    },
    pickerHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    pickerTitle: { fontSize: 18, fontWeight: '800', color: c.text },
    pickerClose: {
      width: 30,
      height: 30,
      borderRadius: 9,
      backgroundColor: c.bg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerList: { gap: 8, paddingBottom: 8 },
    pickerItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.bg,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: c.border,
    },
    pickerItemIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pickerItemNome: { flex: 1, fontSize: 14, fontWeight: '600', color: c.text },
    pickerItemBadge: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 2,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    pickerItemQty: { color: '#fff', fontSize: 14, fontWeight: '800' },
    pickerItemUnit: { color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '600' },
  });
}
