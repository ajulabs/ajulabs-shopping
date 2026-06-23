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
import { useEarnings } from '../model/useEarnings';
import { PixModal } from './components/PixModal';
import { EarningsChart } from './components/EarningsChart';
import { DeliveryHistory } from './components/DeliveryHistory';

import { brl } from '../../../../shared/lib/format';

export function EarningsScreen() {
  const {
    entregas,
    loading,
    showPix,
    setShowPix,
    selectedDay,
    setSelectedDay,
    ganhoSemana,
    corridasSemana,
    SALES_7D,
    weekLabels,
    max,
    totalSemana,
    selectedValue,
    selectedLabel,
    selectedCorridas,
    selectedDate,
  } = useEarnings();

  if (loading) {
    return (
      <SafeAreaView style={[s.safeArea, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#F2760F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safeArea}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.header}>
          <Text style={s.headerTitle}>Ganhos</Text>
          <Text style={s.headerSub}>Acompanhe seu desempenho</Text>
        </View>

        <View style={s.heroCard}>
          <View style={s.heroTop}>
            <Text style={s.heroLabel}>Esta semana</Text>
          </View>
          <Text style={s.heroAmount}>{brl(ganhoSemana)}</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>
            {corridasSemana} corridas
          </Text>
          <View style={s.heroBtns}>
            <TouchableOpacity
              style={s.heroBtn}
              onPress={() => setShowPix(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="flash" size={15} color="#FFFFFF" />
              <Text style={s.heroBtnText}>Sacar via Pix</Text>
            </TouchableOpacity>
          </View>
        </View>

        <EarningsChart
          SALES_7D={SALES_7D}
          weekLabels={weekLabels}
          max={max}
          totalSemana={totalSemana}
          selectedDay={selectedDay}
          setSelectedDay={setSelectedDay}
          selectedLabel={selectedLabel}
          selectedDate={selectedDate}
          selectedCorridas={selectedCorridas}
          selectedValue={selectedValue}
        />

        <DeliveryHistory entregas={entregas} />
      </ScrollView>

      <PixModal visible={showPix} ganho={ganhoSemana} onClose={() => setShowPix(false)} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F7FB' },
  scroll: { flex: 1 },
  content: { paddingBottom: 32 },
  header: {
    padding: 16,
    paddingTop: 18,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000933' },
  headerSub: { fontSize: 13, color: '#9099B3', marginTop: 2 },
  heroCard: {
    margin: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: '#000933',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 16,
  },
  heroBtns: { flexDirection: 'row', gap: 10 },
  heroBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2760F',
  },
  heroBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
});
