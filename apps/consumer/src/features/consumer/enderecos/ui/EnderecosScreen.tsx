import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';
import { EnderecoSalvo } from '@ajulabs/types';
import { useTheme, useHardwareBack, useGoBack } from '../../../../shared/hooks';
import { useEnderecoForm, EnderecoFormModal, iconeApelido } from '../../../../entities/endereco';
import { useEnderecos } from '../model/useEnderecos';

export function EnderecosScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn, iconBg } = useTheme();

  const { token, enderecos, loading, carregar, handleRemover, handleDefinirPadrao } =
    useEnderecos();

  const [showModal, setShowModal] = useState(false);
  const enderecoForm = useEnderecoForm(token, () => {
    setShowModal(false);
    carregar();
  });

  const abrirNovo = () => {
    enderecoForm.resetar();
    setShowModal(true);
  };

  const handleEditar = (addr: EnderecoSalvo) => {
    enderecoForm.preencherParaEdicao(addr);
    setShowModal(true);
  };

  const fecharModal = () => setShowModal(false);

  const goBack = useGoBack('/(consumer)/perfil');
  useHardwareBack(() => {
    if (showModal) {
      fecharModal();
      return true;
    }
    goBack();
    return true;
  });

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.navigate('/(consumer)/perfil')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <Text style={[styles.titulo, { color: text }]}>Meus Endereços</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {enderecos.length === 0 && (
            <View style={styles.vazio}>
              <Ionicons
                name="location-outline"
                size={52}
                color={isDark ? 'rgba(255,255,255,0.2)' : colors.n300}
              />
              <Text style={[styles.vazioTitulo, { color: text }]}>Nenhum endereço salvo</Text>
              <Text style={[styles.vazioTxt, { color: textSec as string }]}>
                Adicione um endereço para receber seus pedidos
              </Text>
            </View>
          )}

          {enderecos.map((addr) => (
            <View
              key={addr.id}
              style={[styles.card, { backgroundColor: surf, borderColor: border }]}
            >
              <View style={[styles.cardIconBox, { backgroundColor: iconBg }]}>
                <Ionicons
                  name={iconeApelido(addr.apelido) as any}
                  size={18}
                  color={colors.orange}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cardTitleRow}>
                  <Text style={[styles.cardApelido, { color: text }]}>{addr.apelido}</Text>
                  {addr.padrao && (
                    <View style={styles.badgePadrao}>
                      <Text style={styles.badgePadraoTxt}>Padrão</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.cardRua, { color: textSec as string }]}>{addr.rua}</Text>
                <Text style={[styles.cardBairro, { color: textSec as string }]}>
                  {addr.bairro} · CEP {addr.cep}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  onPress={() => handleEditar(addr)}
                  style={[styles.actionBtn, { backgroundColor: backBtn }]}
                >
                  <Ionicons name="pencil-outline" size={17} color={colors.orange} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => !addr.padrao && handleDefinirPadrao(addr.id)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: addr.padrao ? colors.orange100 : backBtn },
                  ]}
                  activeOpacity={addr.padrao ? 1 : 0.7}
                >
                  <Ionicons
                    name={addr.padrao ? 'star' : 'star-outline'}
                    size={17}
                    color={colors.orange}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleRemover(addr)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: isDark ? 'rgba(163,45,45,0.18)' : '#FCEBEB' },
                  ]}
                >
                  <Ionicons name="trash-outline" size={17} color="#A32D2D" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={abrirNovo} activeOpacity={0.85}>
            <Ionicons name="add-circle-outline" size={20} color={colors.orange} />
            <Text style={styles.addBtnTxt}>Adicionar novo endereço</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <EnderecoFormModal visible={showModal} controller={enderecoForm} onClose={fecharModal} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  vazio: { alignItems: 'center', paddingVertical: 56, gap: 10 },
  vazioTitulo: { fontSize: 17, fontWeight: '700' },
  vazioTxt: { fontSize: 13, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardApelido: { fontSize: 15, fontWeight: '700' },
  cardRua: { fontSize: 13, marginTop: 3 },
  cardBairro: { fontSize: 12 },
  badgePadrao: {
    backgroundColor: colors.orange100,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  badgePadraoTxt: { fontSize: 10, fontWeight: '600', color: colors.orange600 },
  cardActions: { gap: 8 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.orange,
    marginTop: 4,
  },
  addBtnTxt: { fontSize: 14, fontWeight: '600', color: colors.orange },
});
