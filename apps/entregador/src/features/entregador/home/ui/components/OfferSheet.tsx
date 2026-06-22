import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { haversine } from '@ajulabs/maps';
import type { Ride } from '../../../../../entities/corrida';

import { brl, fmtKm } from '../../../../../shared/lib/format';

export function OfferSheet({
  ride,
  countdown,
  userLocation,
  lojaCoords,
  clienteCoords,
  onAccept,
  onReject,
}: {
  ride: Ride;
  countdown: number;
  userLocation: { lat: number; lng: number } | null;
  lojaCoords: { lat: number; lng: number } | null;
  clienteCoords: { lat: number; lng: number } | null;
  onAccept: () => void;
  onReject: () => void;
}) {
  const expirado = countdown <= 0;
  const pct = expirado ? 100 : (countdown / 15) * 100;
  // Distância do entregador até a loja (coleta) e da loja até o cliente (entrega).
  // Em km; null enquanto as coordenadas ainda estão sendo resolvidas/geocodificadas.
  const pickupKm = userLocation && lojaCoords ? haversine(userLocation, lojaCoords) / 1000 : null;
  const deliveryKm =
    lojaCoords && clienteCoords ? haversine(lojaCoords, clienteCoords) / 1000 : null;
  // Total exibido: soma dos dois trechos quando ambos conhecidos; senão usa o que
  // houver (entrega calculada ou a distância vinda do backend).
  const totalKm =
    pickupKm != null && deliveryKm != null
      ? pickupKm + deliveryKm
      : (deliveryKm ?? (ride.distancia > 0 ? ride.distancia : null));
  return (
    <View style={s.offerSheet}>
      <View style={s.timerTrack}>
        <View
          style={[
            s.timerBar,
            {
              width: `${pct}%` as any,
              backgroundColor: expirado ? '#9099B3' : pct > 40 ? '#F2760F' : '#E14B3C',
            },
          ]}
        />
      </View>

      <View style={s.offerContent}>
        <View style={s.offerHeader}>
          <View style={s.offerTag}>
            <Ionicons name="flash" size={13} color="#F2760F" />
            <Text style={s.offerTagText}>Nova corrida</Text>
          </View>
          <View style={[s.countPill, expirado && s.countPillExpired]}>
            {expirado ? (
              <Text style={s.countPillTextExpired}>Disponível</Text>
            ) : (
              <>
                <View style={s.countDot} />
                <Text style={s.countPillText}>{countdown}s</Text>
              </>
            )}
          </View>
        </View>

        <Text style={s.valueLabel}>Você recebe</Text>
        <Text style={s.valueAmount}>{brl(ride.ganho)}</Text>
        <View style={s.statRow}>
          <View style={s.statPill}>
            <Ionicons name="time-outline" size={14} color="#5A6079" />
            <Text style={s.statPillText}>~{ride.duracao} min</Text>
          </View>
          {totalKm != null && (
            <View style={s.statPill}>
              <Ionicons name="navigate-outline" size={14} color="#5A6079" />
              <Text style={s.statPillText}>{fmtKm(totalKm)} total</Text>
            </View>
          )}
        </View>

        <View style={s.routeCard}>
          <View style={s.routeRow}>
            {ride.loja.logoUrl ? (
              <Image source={{ uri: ride.loja.logoUrl }} style={s.routeLogo} resizeMode="cover" />
            ) : (
              <View style={[s.routeLogo, s.routeLogoFallback]}>
                <Ionicons name="storefront" size={20} color="#000933" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Coletar em</Text>
              <Text style={s.routeMain} numberOfLines={1}>
                {ride.loja.nome}
              </Text>
              <Text style={s.routeSub} numberOfLines={1}>
                {ride.loja.endereco} · {ride.loja.bairro}
              </Text>
            </View>
            {pickupKm != null && (
              <View style={s.legDist}>
                <Text style={s.legDistVal}>{fmtKm(pickupKm)}</Text>
                <Text style={s.legDistLabel}>de você</Text>
              </View>
            )}
          </View>
          <View style={s.routeConnector} />
          <View style={s.routeRow}>
            <View style={s.dropPin}>
              <Ionicons name="location" size={20} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.routeLabel}>Entregar em</Text>
              <Text style={s.routeMain} numberOfLines={1}>
                {ride.cliente.bairro}
              </Text>
              <Text style={s.routeSub} numberOfLines={1}>
                {ride.cliente.endereco}
              </Text>
            </View>
            {deliveryKm != null && (
              <View style={s.legDist}>
                <Text style={s.legDistVal}>{fmtKm(deliveryKm)}</Text>
                <Text style={s.legDistLabel}>da loja</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={s.btnAccept} onPress={onAccept} activeOpacity={0.9}>
          <Text style={s.btnAcceptText}>Aceitar corrida</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity style={s.btnReject} onPress={onReject} activeOpacity={0.7}>
          <Text style={s.btnRejectText}>Recusar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  offerSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
    paddingBottom: 8,
    zIndex: 20,
  },
  timerTrack: {
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#E4E7F1',
    overflow: 'hidden',
  },
  timerBar: { height: '100%' },
  offerContent: { padding: 20, paddingTop: 16 },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  offerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF0E3',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 99,
  },
  offerTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F2760F',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#000933',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    minWidth: 58,
    justifyContent: 'center',
  },
  countPillExpired: { backgroundColor: '#E6F7ED' },
  countDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#39FF89' },
  countPillText: { fontSize: 12.5, fontWeight: '800', color: '#FFFFFF' },
  countPillTextExpired: { fontSize: 12.5, fontWeight: '800', color: '#046C2E' },

  valueLabel: { fontSize: 12.5, fontWeight: '600', color: '#9099B3', textAlign: 'center' },
  valueAmount: {
    fontSize: 46,
    fontWeight: '900',
    color: '#000933',
    textAlign: 'center',
    letterSpacing: -1.2,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F6F7FB',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 99,
  },
  statPillText: { fontSize: 13, fontWeight: '700', color: '#5A6079' },

  routeCard: { backgroundColor: '#F8F9FC', borderRadius: 16, padding: 16, marginBottom: 18 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF' },
  routeLogoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  dropPin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#209CEF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeConnector: {
    width: 2,
    height: 18,
    backgroundColor: '#D7DBEA',
    marginLeft: 21,
    marginVertical: 5,
    borderRadius: 1,
  },
  routeLabel: {
    fontSize: 10.5,
    color: '#9099B3',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  routeMain: { fontSize: 14.5, fontWeight: '700', color: '#000933', marginTop: 1 },
  routeSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
  legDist: { alignItems: 'flex-end', marginLeft: 8 },
  legDistVal: { fontSize: 13, fontWeight: '800', color: '#000933' },
  legDistLabel: { fontSize: 10, color: '#9099B3', marginTop: 1 },
  btnAccept: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 17,
    shadowColor: '#F2760F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnAcceptText: { fontSize: 15.5, fontWeight: '800', color: '#FFFFFF' },
  btnReject: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 6 },
  btnRejectText: { fontSize: 14, fontWeight: '700', color: '#9099B3' },
});
