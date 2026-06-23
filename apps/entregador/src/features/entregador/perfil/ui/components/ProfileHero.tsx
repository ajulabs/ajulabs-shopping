import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface ProfileHeroProps {
  loading: boolean;
  nome: string;
  initials: string;
  fotoPerfil: string | null;
  tipoTransporte: 'moto' | 'carro' | 'bike';
  veiculoLabel: string | null;
  totalEntregas: number;
  corridasSemana: number;
  ganhoTotal: string;
  onTrocarFoto: () => void;
  onExpandPhoto: () => void;
}

export function ProfileHero({
  loading,
  nome,
  initials,
  fotoPerfil,
  tipoTransporte,
  veiculoLabel,
  totalEntregas,
  corridasSemana,
  ganhoTotal,
  onTrocarFoto,
  onExpandPhoto,
}: ProfileHeroProps) {
  return (
    <View style={s.hero}>
      <View style={s.heroRow}>
        <TouchableOpacity
          style={s.avatar}
          onPress={fotoPerfil ? onExpandPhoto : onTrocarFoto}
          activeOpacity={0.8}
        >
          {fotoPerfil ? (
            <Image source={{ uri: fotoPerfil }} style={s.avatarImg} />
          ) : (
            <Text style={s.avatarText}>{initials}</Text>
          )}
          <TouchableOpacity style={s.avatarEdit} onPress={onTrocarFoto} activeOpacity={0.8}>
            <Ionicons name="camera" size={10} color="#FFFFFF" />
          </TouchableOpacity>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.heroName}>{nome}</Text>
          {veiculoLabel ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
              {tipoTransporte === 'moto' ? (
                <MaterialCommunityIcons name="motorbike" size={13} color="rgba(255,255,255,0.7)" />
              ) : (
                <Ionicons
                  name={tipoTransporte === 'bike' ? 'bicycle' : 'car'}
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
              )}
              <Text style={s.heroTransporte}>{veiculoLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={[s.statsBox, { justifyContent: 'center', paddingVertical: 20 }]}>
          <ActivityIndicator color="#F2760F" />
        </View>
      ) : (
        <View style={s.statsBox}>
          <View style={s.statCol}>
            <Text style={s.statVal}>{totalEntregas}</Text>
            <Text style={s.statLabel}>Entregas</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={s.statVal}>{corridasSemana}</Text>
            <Text style={s.statLabel}>Esta semana</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statCol}>
            <Text style={s.statVal}>{ganhoTotal}</Text>
            <Text style={s.statLabel}>Total ganho</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: '#000933',
    padding: 20,
    paddingBottom: 24,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#F2760F',
  },
  avatarImg: { width: 64, height: 64, borderRadius: 32 },
  avatarEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2760F',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#000933',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  heroName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.3 },
  heroTransporte: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  statsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  statCol: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', lineHeight: 26 },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2, textAlign: 'center' },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.15)' },
});
