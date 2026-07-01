import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { brl } from '../../../../../shared/lib/format';
import { useMemo, useState } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

/** Logo da loja com fallback para ícone quando não há URL ou a imagem falha. */
function LojaLogo({
  uri,
  imgStyle,
  fallbackStyle,
}: {
  uri?: string;
  imgStyle: object;
  fallbackStyle: object;
}) {
  const [erro, setErro] = useState(false);
  if (!uri || erro) {
    return (
      <View style={fallbackStyle}>
        <Ionicons name="storefront" size={17} color="#9099B3" />
      </View>
    );
  }
  return (
    <Image source={{ uri }} style={imgStyle} resizeMode="cover" onError={() => setErro(true)} />
  );
}

export function DeliveryHistory({ entregas }: { entregas: any[] }) {
  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <>
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Corridas recentes</Text>
      </View>

      {entregas.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 24 }}>
          <Text style={{ fontSize: 13, color: theme.textMut }}>Nenhuma entrega ainda</Text>
        </View>
      ) : (
        entregas.slice(0, 10).map((e: any) => {
          const loja = e.pedido?.loja?.nome ?? '–';
          const bairro = e.pedido?.enderecoEntrega?.bairro ?? '–';
          const valor = Number(e.valorRecebido ?? 0) + Number(e.bonus ?? 0);
          const data = e.criadoEm
            ? new Date(e.criadoEm).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '–';
          return (
            <View key={e.id} style={s.historyRow}>
              <LojaLogo
                uri={e.pedido?.loja?.logoUrl}
                imgStyle={s.historyLogo}
                fallbackStyle={s.historyIcon}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.historyTrajeto} numberOfLines={1}>
                  {loja} → {bairro}
                </Text>
                <Text style={s.historyData}>{data}</Text>
              </View>
              <Text style={s.historyValor}>{brl(valor)}</Text>
            </View>
          );
        })
      )}
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginHorizontal: 16,
      marginTop: 8,
      marginBottom: 10,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.text },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 12,
      backgroundColor: theme.surf,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    historyIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    historyLogo: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: theme.bg,
    },
    historyTrajeto: { fontSize: 13, fontWeight: '600', color: theme.text },
    historyData: { fontSize: 11, color: theme.textMut },
    historyValor: { fontSize: 14, fontWeight: '700', color: theme.text },
  });
}
