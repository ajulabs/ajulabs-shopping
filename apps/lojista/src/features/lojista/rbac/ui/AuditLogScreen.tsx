import { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AuditLogEntry } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useTheme } from '../../../../shared/hooks';
import {
  ACTION_LABEL,
  ACTION_ICON,
  ACTION_COLOR,
  PAPEL_LABEL,
  formatarData,
} from '../lib/auditLog';
import { useAuditLog } from '../model/useAuditLog';

interface Props {
  onVoltar: () => void;
}

export function AuditLogScreen({ onVoltar }: Props) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const {
    logs,
    loading,
    refreshing,
    setRefreshing,
    detalhe,
    setDetalhe,
    carregandoMais,
    carregar,
    carregarMais,
  } = useAuditLog();

  const renderItem = useCallback(
    ({ item }: { item: AuditLogEntry }) => {
      const icon = ACTION_ICON[item.action] ?? 'ellipse-outline';
      const cor = ACTION_COLOR[item.action] ?? colors.n300;
      const label = ACTION_LABEL[item.action] ?? item.action;
      return (
        <TouchableOpacity
          style={[styles.logItem, { backgroundColor: theme.surf, borderColor: theme.border }]}
          onPress={() => setDetalhe(item)}
          activeOpacity={0.75}
        >
          <View style={[styles.logIcon, { backgroundColor: cor + '18' }]}>
            <Ionicons name={icon as any} size={20} color={cor} />
          </View>
          <View style={styles.logInfo}>
            <Text style={[styles.logAction, { color: theme.text }]}>{label}</Text>
            <Text style={[styles.logEntity, { color: theme.textMut }]} numberOfLines={1}>
              {item.entityName}
            </Text>
            <View style={styles.logMeta}>
              <Text style={[styles.logActor, { color: theme.textSec }]}>{item.actorNome}</Text>
              <Text style={styles.logDot}>·</Text>
              <Text style={[styles.logPapel, { color: theme.textMut }]}>
                {PAPEL_LABEL[item.actorPapel] ?? item.actorPapel}
              </Text>
              <Text style={styles.logDot}>·</Text>
              <Text style={[styles.logData, { color: theme.textMut }]}>
                {formatarData(item.timestamp)}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMut} />
        </TouchableOpacity>
      );
    },
    [setDetalhe, theme],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surf,
            borderBottomColor: theme.border,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity onPress={onVoltar} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Log de auditoria</Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.lista}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: theme.borderL }]} />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                carregar(true);
              }}
            />
          }
          onEndReached={carregarMais}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textMut }]}>
              Nenhum registro encontrado.
            </Text>
          }
          ListFooterComponent={
            carregandoMais ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator color={colors.orange} />
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de detalhe */}
      <Modal
        visible={!!detalhe}
        transparent
        animationType="slide"
        onRequestClose={() => setDetalhe(null)}
      >
        <Pressable style={styles.overlay} onPress={() => setDetalhe(null)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: theme.surf }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
            {detalhe && (
              <>
                <Text style={[styles.sheetTitle, { color: theme.text }]}>
                  {ACTION_LABEL[detalhe.action] ?? detalhe.action}
                </Text>

                <DetalheRow
                  label="Entidade"
                  value={`${detalhe.entityType}: ${detalhe.entityName}`}
                />
                <DetalheRow
                  label="Autor"
                  value={`${detalhe.actorNome} (${PAPEL_LABEL[detalhe.actorPapel] ?? detalhe.actorPapel})`}
                />
                <DetalheRow label="Data/hora" value={formatarData(detalhe.timestamp)} />
                {detalhe.ipAddress && <DetalheRow label="IP" value={detalhe.ipAddress} />}

                {detalhe.changes && Object.keys(detalhe.changes).length > 0 && (
                  <>
                    <Text style={[styles.changesTitle, { color: theme.text }]}>Alterações</Text>
                    {Object.entries(detalhe.changes).map(([campo, { before, after }]) => (
                      <View key={campo} style={styles.changeRow}>
                        <Text style={[styles.changeCampo, { color: theme.textMut }]}>{campo}</Text>
                        <View style={styles.changeValues}>
                          <Text style={styles.changeBefore}>{JSON.stringify(before)}</Text>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={theme.textMut}
                            style={{ marginHorizontal: 6 }}
                          />
                          <Text style={styles.changeAfter}>{JSON.stringify(after)}</Text>
                        </View>
                      </View>
                    ))}
                  </>
                )}

                <TouchableOpacity
                  style={[styles.fecharBtn, { borderColor: theme.border }]}
                  onPress={() => setDetalhe(null)}
                >
                  <Text style={[styles.fecharText, { color: theme.textSec }]}>Fechar</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function DetalheRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.detalheRow}>
      <Text style={[styles.detalheLabel, { color: theme.textMut }]}>{label}</Text>
      <Text style={[styles.detalheValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.navy },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  lista: { padding: 0 },
  emptyText: { textAlign: 'center', color: colors.n600, marginTop: 40, fontSize: 14 },
  separator: { height: 1, backgroundColor: '#E2E8F0' },

  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  logIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logInfo: { flex: 1 },
  logAction: { fontSize: 14, fontWeight: '700', color: colors.navy },
  logEntity: { fontSize: 13, color: colors.n600, marginTop: 1 },
  logMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 2 },
  logActor: { fontSize: 11, color: colors.n600, fontWeight: '600' },
  logDot: { fontSize: 11, color: colors.n300, marginHorizontal: 3 },
  logPapel: { fontSize: 11, color: colors.n500 },
  logData: { fontSize: 11, color: colors.n300 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,9,51,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.navy, marginBottom: 16 },

  detalheRow: { marginBottom: 12 },
  detalheLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  detalheValue: { fontSize: 14, color: colors.navy },

  changesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navy,
    marginTop: 8,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  changeRow: { marginBottom: 10, backgroundColor: '#F8FAFC', borderRadius: 10, padding: 10 },
  changeCampo: { fontSize: 12, fontWeight: '700', color: colors.n600, marginBottom: 6 },
  changeValues: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  changeBefore: { fontSize: 13, color: '#DC2626', fontFamily: 'monospace' },
  changeAfter: { fontSize: 13, color: '#059669', fontFamily: 'monospace' },

  fecharBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  fecharText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
});
