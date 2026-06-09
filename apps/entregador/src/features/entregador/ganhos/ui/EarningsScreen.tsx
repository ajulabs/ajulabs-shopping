import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EntregadorService } from '../../../../lib/authServices';
import { useAuthEntregadorStore } from '../../auth/model/store';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function buildWeekdayLabels(dailyData: any[] | null): string[] {
  if (dailyData) {
    return dailyData.slice(-7).map((d: any) => {
      if (!d.dia && !d.data) return '–';
      const date = new Date(d.dia ?? d.data);
      return WEEKDAY_LABELS[date.getDay()];
    });
  }
  const today = new Date().getDay();
  return Array.from({ length: 7 }, (_, i) => WEEKDAY_LABELS[(today - 6 + i + 7) % 7]);
}

function PixModal({
  visible,
  ganho,
  onClose,
}: {
  visible: boolean;
  ganho: number;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' }}>
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 28,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E4E7F1',
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#000933', marginBottom: 6 }}>
            Sacar via Pix
          </Text>
          <Text style={{ fontSize: 13, color: '#9099B3', marginBottom: 20, lineHeight: 19 }}>
            O valor disponível para saque será transferido para a chave Pix cadastrada nos seus
            dados bancários.
          </Text>
          <View
            style={{
              backgroundColor: '#FEF0E3',
              borderRadius: 14,
              padding: 16,
              marginBottom: 20,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: '#9099B3',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              Disponível para saque
            </Text>
            <Text style={{ fontSize: 36, fontWeight: '800', color: '#F2760F' }}>
              {ganho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </Text>
          </View>
          <TouchableOpacity
            style={{
              height: 50,
              borderRadius: 14,
              backgroundColor: '#F2760F',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
            onPress={() => {
              onClose();
              Alert.alert(
                'Saque solicitado!',
                'Seu saque foi processado e será creditado em até 1 dia útil na chave Pix cadastrada.',
              );
            }}
            activeOpacity={0.85}
          >
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
              Confirmar saque
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: 44,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: '#E4E7F1',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#9099B3' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function EarningsScreen() {
  const token = useAuthEntregadorStore((s) => s.token);
  const [ganhos, setGanhos] = useState<any>(null);
  const [entregas, setEntregas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPix, setShowPix] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(6);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    Promise.all([
      EntregadorService.buscarGanhos(token).catch(() => null),
      EntregadorService.listarEntregas(token).catch(() => []),
    ])
      .then(([g, e]) => {
        setGanhos(g);
        setEntregas(e ?? []);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const ganhoSemana = Number(ganhos?.semana?.total ?? 0);
  const corridasSemana = Number(ganhos?.semana?.corridas ?? 0);
  const dailyData: any[] | null = ganhos?.porDia ?? ganhos?.dias ?? null;
  const SALES_7D = dailyData
    ? dailyData.slice(-7).map((d: any) => Number(d.total ?? d.ganho ?? 0))
    : [0, 0, 0, 0, 0, 0, ganhoSemana];
  const weekLabels = buildWeekdayLabels(dailyData);
  const max = Math.max(...SALES_7D, 1);
  const totalSemana = ganhoSemana;

  const selectedValue = SALES_7D[selectedDay] ?? 0;
  const selectedLabel = weekLabels[selectedDay] ?? '–';
  const selectedDailyEntry = dailyData ? dailyData.slice(-7)[selectedDay] : null;
  const selectedCorridas = selectedDailyEntry?.corridas ?? selectedDailyEntry?.total_corridas ?? 0;
  const selectedDate = selectedDailyEntry
    ? new Date(selectedDailyEntry.dia ?? selectedDailyEntry.data).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
      })
    : null;

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

        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Últimos 7 dias</Text>
            <Text style={s.chartTotal}>{brl(totalSemana)}</Text>
          </View>
          <View style={s.chart}>
            {SALES_7D.map((v, i) => {
              const h = max > 0 ? (v / max) * 100 : 2;
              const isToday = i === SALES_7D.length - 1;
              const isSel = i === selectedDay;
              const barColor = isSel ? '#F2760F' : isToday ? 'rgba(242,118,15,0.25)' : '#E4E7F1';
              return (
                <TouchableOpacity
                  key={i}
                  style={s.chartCol}
                  onPress={() => setSelectedDay(i)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.chartBarVal, { color: isSel ? '#F2760F' : '#9099B3' }]}>
                    {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : Math.round(v)}
                  </Text>
                  <View style={s.chartBarTrack}>
                    <View
                      style={[s.chartBar, { height: `${h}%` as any, backgroundColor: barColor }]}
                    />
                  </View>
                  <Text
                    style={[
                      s.chartDay,
                      {
                        color: isSel ? '#F2760F' : isToday ? 'rgba(242,118,15,0.6)' : '#9099B3',
                        fontWeight: isSel ? '700' : '500',
                      },
                    ]}
                  >
                    {weekLabels[i]}
                  </Text>
                  {isSel && <View style={s.chartSelDot} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Detalhe do dia selecionado */}
          <View style={s.dayDetail}>
            <View style={{ flex: 1 }}>
              <Text style={s.dayDetailLabel}>
                {selectedLabel}
                {selectedDate ? ` · ${selectedDate}` : ''}
              </Text>
              <Text style={s.dayDetailSub}>
                {selectedCorridas > 0
                  ? `${selectedCorridas} corrida${selectedCorridas !== 1 ? 's' : ''}`
                  : 'Sem corridas'}
              </Text>
            </View>
            <Text style={[s.dayDetailAmount, { color: selectedValue > 0 ? '#000933' : '#9099B3' }]}>
              {brl(selectedValue)}
            </Text>
          </View>
        </View>

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Corridas recentes</Text>
        </View>

        {entregas.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ fontSize: 13, color: '#9099B3' }}>Nenhuma entrega ainda</Text>
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
                <View style={s.historyIcon}>
                  <Ionicons name="swap-horizontal" size={17} color="#9099B3" />
                </View>
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
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(57,255,137,0.2)',
    borderRadius: 99,
  },
  trendText: { fontSize: 11, fontWeight: '700', color: '#39FF89' },
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
  heroBtnOutline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBtnText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  chartTotal: { fontSize: 16, fontWeight: '700', color: '#F2760F' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 130 },
  chartCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end' },
  chartBarVal: { fontSize: 10, color: '#9099B3', fontWeight: '600', marginBottom: 4 },
  chartBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  chartBar: { width: '100%', borderRadius: 6, minHeight: 4 },
  chartDay: { fontSize: 10, marginTop: 6 },
  chartSelDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#F2760F', marginTop: 3 },
  dayDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
  },
  dayDetailLabel: { fontSize: 13, fontWeight: '700', color: '#000933' },
  dayDetailSub: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  dayDetailAmount: { fontSize: 18, fontWeight: '800' },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaTitle: { fontSize: 13.5, fontWeight: '600', color: '#000933', marginBottom: 2 },
  metaSub: { fontSize: 11.5, color: '#9099B3' },
  metaTrack: {
    height: 5,
    backgroundColor: '#F0F1F5',
    borderRadius: 99,
    marginTop: 8,
    overflow: 'hidden',
  },
  metaFill: { height: '100%', backgroundColor: '#F2760F', borderRadius: 99 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  sectionLink: { fontSize: 12, fontWeight: '600', color: '#F2760F' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyTrajeto: { fontSize: 13, fontWeight: '600', color: '#000933' },
  historyData: { fontSize: 11, color: '#9099B3' },
  historyDot: { fontSize: 11, color: '#9099B3' },
  historyValor: { fontSize: 14, fontWeight: '700', color: '#000933' },
});
