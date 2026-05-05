// src/features/consumer/vitrines/ui/VitrinesList.tsx
import { useState, useCallback } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LOJAS } from '@ajulabs/api-client';
import { colors } from '@ajulabs/theme';
import { LojaCard } from './LojaCard';
import { LojasDestaque } from './LojasDestaque';
import { CategoriasBar, CATEGORIAS } from './CategoriasBar';

interface VitrinasListProps {
  dark?: boolean;
}

export function VitrinesList({ dark = false }: VitrinasListProps) {
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const router = useRouter();

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? colors.bgDark : '#FAFBFE';
  const surface   = dark ? colors.surfDark : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const lojasFiltradas = LOJAS.filter(l => {
    const buscaOk = l.nome.toLowerCase().includes(busca.toLowerCase()) ||
      l.endereco.bairro.toLowerCase().includes(busca.toLowerCase());
    const categoriaOk = categoria === 'todos' || l.categoria === categoria;
    return buscaOk && categoriaOk;
  });

  const handleAbrirVitrine = useCallback((id: string) => {
    router.push(`/(consumer)/vitrine/${id}`);
  }, [router]);

  return (
    <View style={[styles.container, { backgroundColor: bgMain }]}>

      {/* Cabeçalho */}
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <Text style={[styles.titulo, { color: textColor }]}>Lojas em Aracaju</Text>
        <Text style={[styles.subtitulo, { color: subColor }]}>
          {LOJAS.length} lojas parceiras · entrega em até 50 min
        </Text>
        <View style={[styles.buscaWrapper, {
          backgroundColor: dark ? 'rgba(255,255,255,0.05)' : colors.n50,
          borderColor: border,
        }]}>
          <Text style={{ color: subColor, fontSize: 16 }}>🔍</Text>
          <TextInput
            style={[styles.buscaInput, { color: textColor }]}
            placeholder="Buscar lojas ou bairros…"
            placeholderTextColor={subColor}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      {/* Lista */}
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
              <LojasDestaque onAbrirVitrine={handleAbrirVitrine} dark={dark} />
            )}
            {lojasFiltradas.length > 0 && (
              <Text style={[styles.secaoTitulo, { color: textColor }]}>
                {categoria === 'todos' ? 'Todas as lojas' : CATEGORIAS.find(c => c.id === categoria)?.label}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <Text style={[styles.vazio, { color: subColor }]}>Nenhuma loja encontrada.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { paddingHorizontal: 16, paddingTop: 52, paddingBottom: 12, borderBottomWidth: 1 },
  titulo:      { fontWeight: '700', fontSize: 22, letterSpacing: -0.3 },
  subtitulo:   { fontSize: 13, marginTop: 4 },
  buscaWrapper:{ flexDirection: 'row', alignItems: 'center', gap: 10,
                 borderWidth: 1, borderRadius: 14,
                 paddingHorizontal: 14, paddingVertical: 10, marginTop: 14 },
  buscaInput:  { flex: 1, fontSize: 14, padding: 0 },
  secaoTitulo: { fontSize: 14, fontWeight: '700', marginBottom: 4, marginTop: 8, paddingHorizontal: 16 },
  vazio:       { textAlign: 'center', marginTop: 40, fontSize: 14 },
});