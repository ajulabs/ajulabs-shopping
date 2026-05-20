import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EnderecoSalvo } from '@ajulabs/types';
import { colors } from '@ajulabs/theme';
import { EnderecoService } from '@ajulabs/api-client';
import { useAuthStore } from '../../../../store';
import { AddressMap } from '../../../../components/AddressMap';

interface Props {
  enderecoId: string;
  onSelect: (id: string) => void;
}

export function StepEndereco({ enderecoId, onSelect }: Props) {
  const router = useRouter();
  const token = useAuthStore(s => s.token);
  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarEnderecos = useCallback(() => {
    if (!token) { setLoading(false); return; }
    setLoading(true);
    EnderecoService.listar(token)
      .then(data => {
        setEnderecos(data);
        if (data.length > 0 && !enderecoId) {
          const padrao = data.find(e => e.padrao) ?? data[0];
          onSelect(padrao.id);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { carregarEnderecos(); }, [token]);

  const enderecoSelecionado = enderecos.find(e => e.id === enderecoId);
  const addressString = enderecoSelecionado
    ? `${enderecoSelecionado.rua}, ${enderecoSelecionado.bairro}`
    : '';

  if (loading) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: 40 }}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.titulo}>Onde a gente entrega?</Text>

      {enderecos.length === 0 ? (
        <View style={styles.vazio}>
          <Ionicons name="location-outline" size={32} color={colors.n300} />
          <Text style={styles.vazioTxt}>Nenhum endereço cadastrado</Text>
        </View>
      ) : (
        enderecos.map((addr) => {
          const selected = addr.id === enderecoId;
          return (
            <TouchableOpacity
              key={addr.id}
              style={[styles.card, selected && styles.cardSelected]}
              onPress={() => onSelect(addr.id)}
              activeOpacity={0.8}
            >
              <View style={[styles.iconBox, selected && styles.iconBoxSelected]}>
                <Ionicons
                  name="location"
                  size={18}
                  color={selected ? '#fff' : colors.navy}
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.apelido}>{addr.apelido}</Text>
                  {addr.padrao && (
                    <View style={styles.badgePadrao}>
                      <Text style={styles.badgePadraoTxt}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.rua}>{addr.rua}</Text>
                <Text style={styles.bairro}>{addr.bairro} · {addr.cep}</Text>
              </View>

              {selected && (
                <View style={styles.check}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {enderecoSelecionado && (
        <View style={styles.mapContainer}>
          <AddressMap
            address={addressString}
            style={styles.map}
          />
          <View style={styles.mapOverlay}>
            <Ionicons name="location" size={12} color={colors.orange} />
            <Text style={styles.mapOverlayTxt} numberOfLines={1}>
              {enderecoSelecionado.rua}, {enderecoSelecionado.bairro}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={styles.addBtn}
        activeOpacity={0.7}
        onPress={() => router.push('/(consumer)/enderecos')}
      >
        <Ionicons name="add" size={18} color={colors.n500} />
        <Text style={styles.addTxt}>Adicionar novo endereço</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.reloadBtn} onPress={carregarEnderecos} activeOpacity={0.7}>
        <Ionicons name="refresh" size={14} color={colors.n500} />
        <Text style={styles.reloadTxt}>Atualizar lista</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  titulo:         { fontSize: 17, fontWeight: '700', color: colors.navy, marginBottom: 12 },
  vazio:          { alignItems: 'center', paddingVertical: 32, gap: 8 },
  vazioTxt:       { fontSize: 14, color: colors.n500 },
  card:           { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 14,
                    backgroundColor: colors.n0, borderRadius: 14, marginBottom: 10,
                    borderWidth: 1.5, borderColor: colors.n200 },
  cardSelected:   { borderColor: colors.orange },
  iconBox:        { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.n100,
                    alignItems: 'center', justifyContent: 'center' },
  iconBoxSelected:{ backgroundColor: colors.orange },
  apelido:        { fontSize: 14, fontWeight: '600', color: colors.navy },
  badgePadrao:    { backgroundColor: colors.orange100, paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 99 },
  badgePadraoTxt: { fontSize: 10, fontWeight: '600', color: colors.orange600 },
  rua:            { fontSize: 13, color: colors.n600, marginTop: 2 },
  bairro:         { fontSize: 12, color: colors.n600 },
  check:          { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.orange,
                    alignItems: 'center', justifyContent: 'center' },
  mapContainer:   { borderRadius: 14, overflow: 'hidden', marginBottom: 12,
                    height: 160, borderWidth: 1, borderColor: colors.n200 },
  map:            { flex: 1 },
  mapOverlay:     { position: 'absolute', bottom: 8, left: 8, right: 8,
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 6 },
  mapOverlayTxt:  { fontSize: 11, color: colors.navy, fontWeight: '500', flex: 1 },
  addBtn:         { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 14,
                    borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed',
                    borderColor: colors.n200 },
  addTxt:         { fontSize: 13, fontWeight: '500', color: colors.n500 },
  reloadBtn:      { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center',
                    paddingVertical: 8, marginTop: 8 },
  reloadTxt:      { fontSize: 12, color: colors.n500 },
});