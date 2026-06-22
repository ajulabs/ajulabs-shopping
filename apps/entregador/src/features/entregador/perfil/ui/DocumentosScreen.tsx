import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDocumentos, STATUS_CONFIG } from '../model/useDocumentos';
import { DocCard } from './components/DocCard';

interface Props {
  onBack: () => void;
}

export function DocumentosScreen({ onBack }: Props) {
  const { loading, preview, setPreview, docIdentidade, statusId, docVeiculo, statusVei } =
    useDocumentos();

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={20} color="#000933" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Meus documentos</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#F2760F" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          {/* Banner de status geral */}
          {docIdentidade && (
            <View
              style={[
                s.banner,
                { backgroundColor: STATUS_CONFIG[statusId!]?.bg ?? 'rgba(242,118,15,0.1)' },
              ]}
            >
              <Ionicons
                name={(STATUS_CONFIG[statusId!]?.icon ?? 'time') as any}
                size={18}
                color={STATUS_CONFIG[statusId!]?.color ?? '#F2760F'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[s.bannerTitle, { color: STATUS_CONFIG[statusId!]?.color ?? '#F2760F' }]}
                >
                  {statusId === 'aprovado'
                    ? 'Documentos aprovados'
                    : statusId === 'rejeitado'
                      ? 'Documentos reprovados'
                      : 'Documentos em análise'}
                </Text>
                <Text style={s.bannerSub}>
                  {statusId === 'aprovado'
                    ? 'Sua identidade foi verificada com sucesso.'
                    : statusId === 'rejeitado'
                      ? 'Seus documentos foram reprovados. Entre em contato com o suporte.'
                      : 'Estamos analisando seus documentos. Isso pode levar até 24 horas.'}
                </Text>
              </View>
            </View>
          )}

          {/* Documentos de identidade */}
          <Text style={s.sectionLabel}>Documento de identidade (CNH ou RG)</Text>
          <View style={s.section}>
            <DocCard
              title="Frente"
              subtitle="Frente do documento"
              imageUrl={docIdentidade?.frenteUrl ?? null}
              status={statusId}
              onPreview={setPreview}
            />
            <View style={s.cardDivider} />
            <DocCard
              title="Verso"
              subtitle="Verso do documento"
              imageUrl={docIdentidade?.versoUrl ?? null}
              status={statusId}
              onPreview={setPreview}
            />
          </View>

          {/* Documentos do veículo */}
          <Text style={[s.sectionLabel, { marginTop: 20 }]}>Documentos do veículo</Text>
          <View style={s.section}>
            <DocCard
              title="CNH"
              subtitle="Carteira Nacional de Habilitação"
              imageUrl={docVeiculo?.cnhUrl ?? null}
              status={statusVei}
              onPreview={setPreview}
            />
            <View style={s.cardDivider} />
            <DocCard
              title="Documento do veículo"
              subtitle="CRLV ou DUT"
              imageUrl={docVeiculo?.docVeiculoUrl ?? null}
              status={statusVei}
              onPreview={setPreview}
            />
          </View>

          {!docIdentidade && !docVeiculo && (
            <View style={s.emptyBox}>
              <Ionicons name="document-outline" size={40} color="#9099B3" />
              <Text style={s.emptyTitle}>Nenhum documento enviado</Text>
              <Text style={s.emptyText}>Seus documentos aparecerão aqui após o cadastro.</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal de preview full-screen */}
      <Modal
        visible={!!preview}
        transparent
        animationType="fade"
        onRequestClose={() => setPreview(null)}
      >
        <View style={s.previewModal}>
          <TouchableOpacity
            style={s.previewClose}
            onPress={() => setPreview(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {preview && (
            <Image source={{ uri: preview }} style={s.previewImage} resizeMode="contain" />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F6F7FB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933' },
  content: { padding: 16, paddingBottom: 48 },

  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    marginBottom: 20,
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  bannerSub: { fontSize: 12, color: '#5A6480', lineHeight: 17 },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: '#E4E7F1', marginHorizontal: 16 },

  emptyBox: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#000933' },
  emptyText: { fontSize: 13, color: '#9099B3', textAlign: 'center' },

  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: { width: '90%', height: '70%' },
});
