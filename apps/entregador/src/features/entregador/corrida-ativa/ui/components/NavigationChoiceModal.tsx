import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  destinationName: string;
  destinationAddress: string;
  onInternal: () => void;
  onGoogleMaps: () => void;
  onWaze: () => void;
  /** When provided, the sheet can be dismissed (e.g. when changing a previous choice). */
  onClose?: () => void;
}

export function NavigationChoiceModal({
  visible,
  destinationName,
  destinationAddress,
  onInternal,
  onGoogleMaps,
  onWaze,
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        {onClose && <Pressable style={s.backdrop} onPress={onClose} />}
        <View style={s.sheet}>
          <View style={s.handle} />
          <View style={s.titleRow}>
            <Text style={s.title}>Como deseja navegar?</Text>
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={s.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={22} color="#9099B3" />
              </TouchableOpacity>
            )}
          </View>
          <View style={s.destRow}>
            <Ionicons name="navigate" size={14} color="#F2760F" />
            <Text style={s.destName} numberOfLines={1}>
              {destinationName}
            </Text>
          </View>
          <Text style={s.destAddr} numberOfLines={2}>
            {destinationAddress}
          </Text>

          <View style={s.options}>
            <OptionRow
              icon={<MapInternalIcon />}
              bg="#EFF6FF"
              title="Mapa interno"
              sub="Rota dentro do app"
              onPress={onInternal}
            />
            <View style={s.divider} />
            <OptionRow
              icon={<GoogleMapsIcon />}
              bg="#FEF3F2"
              title="Google Maps"
              sub="Abrir no Google Maps"
              onPress={onGoogleMaps}
            />
            <View style={s.divider} />
            <OptionRow
              icon={<WazeIcon />}
              bg="#E8F7FF"
              title="Waze"
              sub="Abrir no Waze"
              onPress={onWaze}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function MapInternalIcon() {
  return <Ionicons name="map" size={26} color="#209CEF" />;
}

function GoogleMapsIcon() {
  return (
    <Image
      source={require('../../../../../../assets/gmaps-icon.png')}
      style={{ width: 30, height: 30 }}
      resizeMode="contain"
    />
  );
}

function WazeIcon() {
  return (
    <Image
      source={require('../../../../../../assets/waze-icon.png')}
      style={{ width: 30, height: 30 }}
      resizeMode="contain"
    />
  );
}

// ── External nav badge (used in ActiveScreen bottom sheet) ─────────────────────

export function ExternalNavBadge({ type }: { type: 'gmaps' | 'waze' }) {
  return (
    <View style={bs.badge}>
      <View style={bs.iconWrap}>{type === 'gmaps' ? <GoogleMapsIcon /> : <WazeIcon />}</View>
      <Text style={bs.badgeText}>{type === 'gmaps' ? 'Google Maps' : 'Waze'}</Text>
    </View>
  );
}

const bs = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconWrap: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 13, fontWeight: '700', color: '#000933' },
});

// ── Option row ─────────────────────────────────────────────────────────────────

function OptionRow({
  icon,
  bg,
  title,
  sub,
  onPress,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={s.option} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.optionIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={s.optionLabels}>
        <Text style={s.optionTitle}>{title}</Text>
        <Text style={s.optionSub}>{sub}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C4C9D8" />
    </TouchableOpacity>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.55)', justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E4E7F1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  closeBtn: { marginLeft: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#000933', flex: 1 },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  destName: { fontSize: 14, fontWeight: '700', color: '#000933', flex: 1 },
  destAddr: { fontSize: 12, color: '#9099B3', marginBottom: 20 },

  options: { borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#F0F1F6' },
  divider: { height: 1, backgroundColor: '#F0F1F6' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
  },
  optionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabels: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '700', color: '#000933' },
  optionSub: { fontSize: 12, color: '#9099B3', marginTop: 1 },
});
