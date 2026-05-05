import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@ajulabs/theme';

interface Props {
  codigoPedido: string;
  tempoMin: number;
  tempoMax: number;
  numLojas: number;
  onAcompanhar: () => void;
  onVoltarHome: () => void;
}

export function StepConfirmacao({
  codigoPedido, tempoMin, tempoMax, numLojas, onAcompanhar, onVoltarHome,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Ícone de sucesso */}
      <View style={styles.checkCircle}>
        <Ionicons name="checkmark" size={44} color={colors.mintText} />
      </View>

      <Text style={styles.titulo}>Pedido confirmado!</Text>
      <Text style={styles.subtitulo}>
        Código <Text style={styles.codigo}>{codigoPedido}</Text> · Aju já avisou as lojas
      </Text>

      {/* Tempo estimado */}
      <View style={styles.tempoCard}>
        <Text style={styles.tempoLabel}>TEMPO ESTIMADO</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="time-outline" size={22} color={colors.orange} />
          <View>
            <Text style={styles.tempoValue}>{tempoMin}–{tempoMax} min</Text>
            <Text style={styles.tempoDesc}>
              {numLojas > 1 ? 'Itens chegam separados por loja' : 'Entrega única'}
            </Text>
          </View>
        </View>
      </View>

      {/* Botões */}
      <TouchableOpacity style={styles.btnAcompanhar} onPress={onAcompanhar} activeOpacity={0.9}>
        <Ionicons name="map-outline" size={18} color={colors.n0} />
        <Text style={styles.btnAcompanharTxt}>Acompanhar pedido</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={onVoltarHome} activeOpacity={0.7}>
        <Text style={styles.voltarTxt}>Voltar para a home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { alignItems: 'center', paddingTop: 20 },
  checkCircle:     { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.mint,
                     alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  titulo:          { fontSize: 22, fontWeight: '700', color: colors.navy },
  subtitulo:       { fontSize: 13, color: colors.n600, marginTop: 8, textAlign: 'center' },
  codigo:          { fontWeight: '700', color: colors.navy },

  tempoCard:       { backgroundColor: colors.n0, borderRadius: 14, padding: 14,
                     marginTop: 20, width: '100%', borderWidth: 1, borderColor: colors.n200 },
  tempoLabel:      { fontSize: 11, fontWeight: '600', color: colors.n500, letterSpacing: 0.5,
                     marginBottom: 8 },
  tempoValue:      { fontSize: 22, fontWeight: '700', color: colors.navy },
  tempoDesc:       { fontSize: 12, color: colors.n600 },

  btnAcompanhar:   { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
                     backgroundColor: colors.orange, height: 52, borderRadius: 14,
                     width: '100%', marginTop: 20 },
  btnAcompanharTxt:{ color: colors.n0, fontSize: 15, fontWeight: '700' },
  voltarTxt:       { color: colors.n500, fontSize: 13, fontWeight: '500', marginTop: 14 },
});