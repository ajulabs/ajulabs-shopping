import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StepProps, CORES_VEICULO, NOMES_CORES } from '../../model/constants';
import { formatPlaca } from '../../model/format';
import { Input } from './Input';
import { Field } from './Field';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function StepVeiculo({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  const [corModal, setCorModal] = useState(false);
  const corAtual = data.cor || '';
  const isPredefinida = NOMES_CORES.includes(corAtual);

  const OPCOES_COR = [...CORES_VEICULO, { nome: 'Outra...', hex: '' }];

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <Field label="Placa" error={erros.placa}>
        <Input
          value={data.placa || ''}
          onChange={(v) => up('placa', formatPlaca(v))}
          placeholder="ABC-1D23"
          maxLength={8}
          autoComplete="off"
          textContentType="none"
        />
      </Field>
      <Field label="Modelo" error={erros.modelo}>
        <Input
          value={data.modelo || ''}
          onChange={(v) => up('modelo', v)}
          placeholder="Ex: Honda CG 160"
          autoCapitalize="words"
        />
      </Field>

      <View style={s.field}>
        <Text style={s.fieldLabel}>COR</Text>
        <TouchableOpacity
          style={[s.bankSelector, !!erros.cor && { borderColor: '#E24B4A' }]}
          onPress={() => setCorModal(true)}
          activeOpacity={0.8}
        >
          {corAtual ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {isPredefinida && (
                <View
                  style={[
                    s.corDot,
                    {
                      backgroundColor:
                        CORES_VEICULO.find((c) => c.nome === corAtual)?.hex ?? '#ccc',
                    },
                  ]}
                />
              )}
              <Text style={s.bankSelectorValue}>{corAtual}</Text>
            </View>
          ) : (
            <Text style={s.bankSelectorPlaceholder}>Selecione a cor</Text>
          )}
          <Ionicons name="chevron-down" size={16} color={theme.textMut} />
        </TouchableOpacity>

        <Modal
          visible={corModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCorModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: theme.surf }}>
            <View style={s.bankModalHeader}>
              <TouchableOpacity onPress={() => setCorModal(false)} style={s.bankModalClose}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
              <Text style={s.bankModalTitle}>Cor do veículo</Text>
            </View>
            <FlatList
              data={OPCOES_COR}
              keyExtractor={(item) => item.nome}
              renderItem={({ item }) => {
                const sel = corAtual === item.nome && item.nome !== 'Outra...';
                return (
                  <TouchableOpacity
                    style={[s.corModalItem, sel && s.corModalItemSel]}
                    onPress={() => {
                      if (item.nome === 'Outra...') {
                        up('cor', '');
                      } else {
                        up('cor', item.nome);
                      }
                      setCorModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {item.hex ? (
                      <View
                        style={[
                          s.corDot,
                          { backgroundColor: item.hex, width: 22, height: 22, borderRadius: 11 },
                        ]}
                      />
                    ) : (
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={sel ? '#F2760F' : '#9099B3'}
                      />
                    )}
                    <Text style={[s.corModalText, sel && { color: '#F2760F', fontWeight: '700' }]}>
                      {item.nome}
                    </Text>
                    {sel && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#F2760F"
                        style={{ marginLeft: 'auto' as any }}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
        {!!erros.cor && <Text style={[s.fieldError, { marginTop: 4 }]}>{erros.cor}</Text>}
      </View>

      {!isPredefinida && (
        <View style={{ marginTop: -4, marginBottom: 12 }}>
          <Input
            value={corAtual}
            onChange={(v) => up('cor', v.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
            placeholder="Digite a cor do veículo..."
            autoCapitalize="words"
          />
        </View>
      )}

      <Field label="Ano" error={erros.ano}>
        <Input
          value={data.ano || ''}
          onChange={(v) => up('ano', v.replace(/\D/g, '').slice(0, 4))}
          placeholder="2022"
          keyboardType="numeric"
        />
      </Field>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    field: { marginBottom: 14 },
    fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 },
    fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
    bankSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 13,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.bg,
    },
    bankSelectorValue: { flex: 1, fontSize: 15, color: theme.text, fontWeight: '500' },
    bankSelectorPlaceholder: { flex: 1, fontSize: 15, color: theme.textMut },
    bankModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    bankModalClose: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bankModalTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    corDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.15)',
    },
    corModalItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    corModalItemSel: { backgroundColor: 'rgba(242,118,15,0.06)' },
    corModalText: { fontSize: 15, color: theme.text },
  });
}
