import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { formatCPF } from '../../../../../shared/lib/formatCPF';
import { StepProps, PIX_TIPOS, BANCOS } from '../../model/constants';
import { formatTel } from '../../model/format';
import { Input } from './Input';
import { Field } from './Field';
import { useMemo } from 'react';
import { useTheme } from '../../../../../shared/hooks';
import type { Theme } from '../../../../../shared/hooks/useTheme';

export function StepBancario({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  const [bancoModal, setBancoModal] = useState(false);
  const [busca, setBusca] = useState('');

  const pixTipo = data.pixTipo || 'cpf';
  const tipoSel = PIX_TIPOS.find((t) => t.id === pixTipo) ?? PIX_TIPOS[0];

  const handlePixChange = (v: string) => {
    if (pixTipo === 'cpf') up('pix', formatCPF(v));
    else if (pixTipo === 'celular') up('pix', formatTel(v));
    else up('pix', v);
  };

  const bancosFiltrados = BANCOS.filter(
    (b) => b.nome.toLowerCase().includes(busca.toLowerCase()) || b.codigo.includes(busca),
  );

  const bancoSelecionado = BANCOS.find((b) => data.banco === `${b.codigo} - ${b.nome}`);

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View>
      <View style={s.pixHint}>
        <Ionicons name="flash" size={18} color="#046C2E" />
        <View>
          <Text style={s.pixHintTitle}>Prefira Pix</Text>
          <Text style={s.pixHintSub}>Saque instantâneo, sem taxa</Text>
        </View>
      </View>

      <Text style={[s.fieldLabel, { marginBottom: 8 }]}>Tipo de chave Pix</Text>
      <View style={s.pixTipos}>
        {PIX_TIPOS.map((t) => {
          const ativo = pixTipo === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[s.pixTipoBtn, ativo && s.pixTipoBtnActive]}
              onPress={() => {
                up('pixTipo', t.id);
                up('pix', '');
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.pixTipoText, ativo && s.pixTipoTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Field label="Chave Pix" error={erros.pix}>
        <Input
          value={data.pix || ''}
          onChange={handlePixChange}
          placeholder={tipoSel.placeholder}
          keyboardType={tipoSel.keyboard}
        />
      </Field>

      <Text style={s.orLabel}>Ou conta bancária</Text>

      <Field label="Banco">
        <TouchableOpacity
          style={s.bankSelector}
          onPress={() => setBancoModal(true)}
          activeOpacity={0.8}
        >
          {bancoSelecionado ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={s.bankCodigoBadge}>
                <Text style={s.bankCodigoBadgeText}>{bancoSelecionado.codigo}</Text>
              </View>
              <Text style={s.bankSelectorValue}>{bancoSelecionado.nome}</Text>
            </View>
          ) : (
            <Text style={s.bankSelectorPlaceholder}>Selecione um banco</Text>
          )}
          <Ionicons name="chevron-down" size={16} color={theme.textMut} />
        </TouchableOpacity>
      </Field>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Agência">
            <Input
              value={data.agencia || ''}
              onChange={(v) => up('agencia', v)}
              placeholder="0000"
              keyboardType="numeric"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Conta" error={erros.conta}>
            <Input
              value={data.conta || ''}
              onChange={(v) => up('conta', v)}
              placeholder="000000-0"
            />
          </Field>
        </View>
      </View>

      <Modal visible={bancoModal} animationType="slide" onRequestClose={() => setBancoModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.surf }}>
          <View style={s.bankModalHeader}>
            <TouchableOpacity
              onPress={() => {
                setBancoModal(false);
                setBusca('');
              }}
              style={s.bankModalClose}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={s.bankModalTitle}>Selecionar banco</Text>
          </View>
          <View style={s.bankSearchBox}>
            <Ionicons name="search" size={16} color={theme.textMut} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou código..."
              placeholderTextColor={theme.textMut}
              style={s.bankSearchInput}
              autoFocus
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={theme.textMut} />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={bancosFiltrados}
            keyExtractor={(item) => item.codigo}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selecionado = data.banco === `${item.codigo} - ${item.nome}`;
              return (
                <TouchableOpacity
                  style={[s.bankItem, selecionado && s.bankItemActive]}
                  onPress={() => {
                    up('banco', `${item.codigo} - ${item.nome}`);
                    setBancoModal(false);
                    setBusca('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.bankCodigoBadge}>
                    <Text style={s.bankCodigoBadgeText}>{item.codigo}</Text>
                  </View>
                  <Text
                    style={[s.bankItemNome, selecionado && { color: '#F2760F', fontWeight: '700' }]}
                  >
                    {item.nome}
                  </Text>
                  {selecionado && <Ionicons name="checkmark-circle" size={20} color="#F2760F" />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: theme.surf2, marginLeft: 66 }} />
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.text, marginBottom: 6 },
    pixHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      backgroundColor: 'rgba(57,255,137,0.15)',
      borderRadius: 12,
      marginBottom: 18,
    },
    pixHintTitle: { fontSize: 13, fontWeight: '700', color: '#046C2E' },
    pixHintSub: { fontSize: 11, color: '#046C2E', opacity: 0.85 },
    orLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMut,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 10,
      marginTop: 6,
    },
    pixTipos: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
    pixTipoBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.bg,
    },
    pixTipoBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.08)' },
    pixTipoText: { fontSize: 13, fontWeight: '600', color: theme.textMut },
    pixTipoTextActive: { color: '#F2760F' },
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
    bankCodigoBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: theme.border,
    },
    bankCodigoBadgeText: { fontSize: 11, fontWeight: '700', color: theme.text },
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
    bankSearchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      margin: 12,
      paddingHorizontal: 14,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.bg,
    },
    bankSearchInput: { flex: 1, fontSize: 15, color: theme.text },
    bankItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    bankItemActive: { backgroundColor: 'rgba(242,118,15,0.05)' },
    bankItemNome: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' },
  });
}
