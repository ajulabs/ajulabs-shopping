import React from 'react';
import { useTheme } from '../../../../shared/hooks';
import type { Theme } from '../../../../shared/hooks/useTheme';
import { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDadosBancarios, brl } from '../model/useDadosBancarios';
import { EditarPixModal } from './components/EditarPixModal';
import { HistoricoSaques } from './components/HistoricoSaques';

interface Props {
  onBack: () => void;
}

export function DadosBancariosScreen({ onBack }: Props) {
  const {
    loading,
    sacando,
    saldoDisp,
    emAndamento,
    totalGanho,
    totalSacado,
    chavePix,
    saques,
    editVisible,
    setEditVisible,
    pixTipo,
    setPixTipo,
    pixValor,
    setPixValor,
    pixFocused,
    setPixFocused,
    saving,
    tipoSel,
    openEdit,
    handlePixChange,
    handleSalvarPix,
    handleSacar,
  } = useDadosBancarios();

  const theme = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Dados bancários</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Saldo */}
          <View style={s.saldoCard}>
            <Text style={s.saldoLabel}>Disponível para saque</Text>
            <Text style={s.saldoValue}>{brl(saldoDisp)}</Text>
            {emAndamento > 0 && (
              <View style={s.andamentoBadge}>
                <Ionicons name="time-outline" size={13} color="#F2760F" />
                <Text style={s.andamentoText}>
                  {emAndamento} entrega{emAndamento !== 1 ? 's' : ''} em andamento
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={[s.sacarBtn, (saldoDisp < 10 || sacando) && { opacity: 0.6 }]}
              onPress={handleSacar}
              activeOpacity={0.85}
              disabled={sacando}
            >
              {sacando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                  <Text style={s.sacarBtnText}>Sacar via Pix</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Resumo */}
          <View style={s.resumoRow}>
            <View style={s.resumoBox}>
              <Text style={s.resumoLabel}>Total ganho</Text>
              <Text style={s.resumoValue}>{brl(totalGanho)}</Text>
            </View>
            <View style={[s.resumoBox, { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
              <Text style={s.resumoLabel}>Total sacado</Text>
              <Text style={s.resumoValue}>{brl(totalSacado)}</Text>
            </View>
          </View>

          {/* Chave Pix card com botão editar */}
          <TouchableOpacity style={s.pixCard} onPress={openEdit} activeOpacity={0.8}>
            <View style={s.pixIcon}>
              <Ionicons name="flash" size={18} color="#046C2E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.pixLabel}>Chave Pix cadastrada</Text>
              <Text style={[s.pixValue, !chavePix && { color: theme.textMut }]}>
                {chavePix ?? 'Toque para cadastrar'}
              </Text>
            </View>
            <View style={s.editBtn}>
              <Ionicons name={chavePix ? 'pencil' : 'add'} size={15} color="#F2760F" />
              <Text style={s.editBtnText}>{chavePix ? 'Editar' : 'Cadastrar'}</Text>
            </View>
          </TouchableOpacity>

          {/* Histórico */}
          <HistoricoSaques saques={saques} />
        </ScrollView>
      )}

      {/* Modal editar chave Pix */}
      <EditarPixModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        pixTipo={pixTipo}
        setPixTipo={setPixTipo}
        pixValor={pixValor}
        setPixValor={setPixValor}
        pixFocused={pixFocused}
        setPixFocused={setPixFocused}
        saving={saving}
        tipoSel={tipoSel}
        onChangePix={handlePixChange}
        onSalvar={handleSalvarPix}
      />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 16,
      backgroundColor: theme.surf,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
    content: { padding: 16, paddingBottom: 40 },

    saldoCard: {
      backgroundColor: theme.isDark ? '#1C2348' : '#000933',
      borderRadius: 18,
      padding: 20,
      marginBottom: 12,
    },
    saldoLabel: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    saldoValue: {
      fontSize: 40,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -1,
      marginBottom: 16,
    },
    andamentoBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginBottom: 14,
      marginTop: -10,
    },
    andamentoText: { fontSize: 11, color: '#F2760F', fontWeight: '600' },
    sacarBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: '#F2760F',
      borderRadius: 12,
      paddingVertical: 14,
    },
    sacarBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    resumoRow: {
      flexDirection: 'row',
      backgroundColor: theme.surf,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 12,
      overflow: 'hidden',
    },
    resumoBox: { flex: 1, padding: 16, alignItems: 'center' },
    resumoLabel: { fontSize: 11, color: theme.textMut, fontWeight: '600', marginBottom: 4 },
    resumoValue: { fontSize: 18, fontWeight: '700', color: theme.text },

    pixCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.surf,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 14,
      marginBottom: 20,
    },
    pixIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: 'rgba(57,255,137,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pixLabel: { fontSize: 11, color: theme.textMut, fontWeight: '600', marginBottom: 2 },
    pixValue: { fontSize: 14, fontWeight: '600', color: theme.text },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 99,
      borderWidth: 1.5,
      borderColor: 'rgba(242,118,15,0.3)',
      backgroundColor: '#FEF0E3',
    },
    editBtnText: { fontSize: 12, fontWeight: '700', color: '#F2760F' },
  });
}
