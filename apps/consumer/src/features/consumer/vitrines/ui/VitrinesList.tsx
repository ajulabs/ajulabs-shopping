import { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { LojaCard } from './LojaCard';
import { LojasDestaque } from './LojasDestaque';
import { CategoriasBar, CATEGORIAS } from './CategoriasBar';
import { useVitrines } from '../model/useVitrines';

interface VitrinasListProps {
  dark?: boolean;
}

export function VitrinesList({ dark = false }: VitrinasListProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    lojas,
    loading,
    busca,
    setBusca,
    categoria,
    setCategoria,
    quantidadeItens,
    lojasFiltradas,
  } = useVitrines();

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? colors.bgDark : '#FAFBFE';
  const surface = dark ? colors.surfDark : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const handleAbrirVitrine = useCallback(
    (id: string) => {
      router.push(`/(consumer)/vitrine/${id}`);
    },
    [router],
  );

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: surface, borderBottomColor: border, paddingTop: insets.top + 12 },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: textColor }]}>Lojas em Aracaju</Text>
            <Text style={[styles.subtitulo, { color: subColor }]}>
              {lojas.length} lojas parceiras · entrega em até 50 min
            </Text>
          </View>
          {quantidadeItens > 0 && (
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={() => router.push('/(consumer)/carrinho')}
              activeOpacity={0.85}
            >
              <Ionicons name="cart" size={18} color={colors.n0} />
              <Text style={styles.cartBadgeTxt}>{quantidadeItens}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View
          style={[
            styles.buscaWrapper,
            {
              backgroundColor: dark ? 'rgba(255,255,255,0.05)' : colors.n50,
              borderColor: border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={subColor as string} />
          <TextInput
            style={[styles.buscaInput, { color: textColor }]}
            placeholder="Buscar lojas ou bairros…"
            placeholderTextColor={subColor}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          data={lojasFiltradas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ paddingHorizontal: 16 }}>
              <LojaCard loja={item} onPress={handleAbrirVitrine} dark={dark} />
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <CategoriasBar
                categoriaSelecionada={categoria}
                onSelecionar={setCategoria}
                dark={dark}
              />
              {categoria === 'todos' && (
                <LojasDestaque lojas={lojas} onAbrirVitrine={handleAbrirVitrine} dark={dark} />
              )}
              {lojasFiltradas.length > 0 && (
                <Text style={[styles.secaoTitulo, { color: textColor }]}>
                  {categoria === 'todos'
                    ? 'Todas as lojas'
                    : CATEGORIAS.find((c) => c.id === categoria)?.label}
                </Text>
              )}
            </>
          }
          ListEmptyComponent={
            <Text style={[styles.vazio, { color: subColor }]}>Nenhuma loja encontrada.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titulo: { fontWeight: '700', fontSize: 22, letterSpacing: -0.3 },
  subtitulo: { fontSize: 13, marginTop: 4 },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.orange,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 99,
  },
  cartBadgeTxt: { color: colors.n0, fontSize: 13, fontWeight: '700' },
  buscaWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  buscaInput: { flex: 1, fontSize: 14, padding: 0 },
  secaoTitulo: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  vazio: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
