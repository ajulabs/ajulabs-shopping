import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../../../store';
import { useThemeStore } from '../../../../store';
import { useTheme } from '../../../../shared/hooks';
import type { CategoriaItem } from '../lib/horarios';
import { PAPEL_CFG } from '../lib/equipe';
import { usePerfilLoja } from '../model/usePerfilLoja';
import { useEquipe } from '../model/useEquipe';
import { Toggle } from './components/Toggle';
import { StoreAvatar } from './components/StoreAvatar';
import { FormField } from './components/FormField';
import { CategoriaPicker } from './components/CategoriaPicker';
import { HorarioGrid } from './components/HorarioGrid';
import { EquipeFormModal } from './components/EquipeFormModal';
import { LogoutModal } from './components/LogoutModal';

interface PerfilLojaProps {
  dark?: boolean;
}

const CATEGORIAS: CategoriaItem[] = [
  { label: 'Alimentação', icone: 'restaurant-outline' },
  { label: 'Padaria e Confeitaria', icone: 'cafe-outline' },
  { label: 'Açougue e Peixaria', icone: 'fish-outline' },
  { label: 'Hortifrúti', icone: 'leaf-outline' },
  { label: 'Bebidas', icone: 'wine-outline' },
  { label: 'Calçados', icone: 'footsteps-outline' },
  { label: 'Roupas e Acessórios', icone: 'shirt-outline' },
  { label: 'Moda Infantil', icone: 'happy-outline' },
  { label: 'Moda Praia e Esporte', icone: 'water-outline' },
  { label: 'Bijuterias e Joias', icone: 'diamond-outline' },
  { label: 'Cosméticos e Beleza', icone: 'color-palette-outline' },
  { label: 'Farmácia', icone: 'medkit-outline' },
  { label: 'Ótica', icone: 'glasses-outline' },
  { label: 'Eletrônicos', icone: 'phone-portrait-outline' },
  { label: 'Informática', icone: 'laptop-outline' },
  { label: 'Eletrodomésticos', icone: 'home-outline' },
  { label: 'Móveis e Decoração', icone: 'bed-outline' },
  { label: 'Papelaria e Livraria', icone: 'book-outline' },
  { label: 'Brinquedos e Games', icone: 'game-controller-outline' },
  { label: 'Esportes e Lazer', icone: 'football-outline' },
  { label: 'Pet Shop', icone: 'paw-outline' },
  { label: 'Ferragens e Construção', icone: 'construct-outline' },
  { label: 'Floricultura', icone: 'flower-outline' },
  { label: 'Serviços', icone: 'build-outline' },
  { label: 'Outros', icone: 'storefront-outline' },
];

type Section = null | 'visual' | 'info' | 'endereco' | 'horarios' | 'agendamento' | 'equipe';

const SECTION_TITLES: Record<Exclude<Section, null>, string> = {
  visual: 'Identidade visual',
  info: 'Informações',
  endereco: 'Endereço',
  horarios: 'Horário de funcionamento',
  agendamento: 'Agendamento',
  equipe: 'Equipe',
};

export function PerfilLoja(_props: PerfilLojaProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const logout = useAuthLojistaStore((s) => s.logout);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);
  const isDark = useThemeStore((s) => s.isDark);
  const toggleDark = useThemeStore((s) => s.toggleDark);

  const {
    loja,
    horarios,
    logoUri,
    bannerUri,
    loading,
    saving,
    saveSuccess,
    uploading,
    logoutVisible,
    setLogoutVisible,
    buscandoCep,
    buscandoLoc,
    erroLoc,
    isDirty,
    abertaAgora,
    updateLoja,
    updateHorario,
    buscarCep,
    usarLocalizacao,
    handleLogout,
    handleDescartar,
    handleSalvar,
    pickAndUpload,
  } = usePerfilLoja();

  const {
    colaboradores,
    equipeModal,
    setEquipeModal,
    editandoCol,
    formCol,
    setFormCol,
    salvandoCol,
    erroCol,
    senhaVisivel,
    setSenhaVisivel,
    abrirCriarColaborador,
    abrirEditarColaborador,
    salvarColaborador,
    alternarAtivoColaborador,
  } = useEquipe();

  const theme = useTheme();
  const dark = theme.isDark;
  const textColor = theme.text;
  const subColor = theme.textSec;
  const bgMain = theme.bg;
  const surface = theme.surf;
  const border = theme.border;

  const [section, setSection] = useState<Section>(null);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' },
        ]}
      >
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.header,
          { backgroundColor: surface, borderBottomColor: border, paddingTop: insets.top + 12 },
        ]}
      >
        {section !== null ? (
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => setSection(null)}
              style={styles.headerBackBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={22} color={textColor} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: textColor }]}>
              {SECTION_TITLES[section]}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.headerTitle, { color: textColor }]}>Perfil da loja</Text>
            <Text style={[styles.headerSub, { color: subColor }]}>
              Gerencie as informações da sua loja
            </Text>
          </>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.sectionLabel, { color: subColor }]}>IDENTIDADE VISUAL</Text>
        <View style={[styles.card, { borderColor: border }]}>
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: colors.navy }]}>
            {bannerUri ? (
              <Image
                source={{ uri: bannerUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : null}
            <TouchableOpacity
              style={styles.bannerEditBtn}
              onPress={() => pickAndUpload('banner')}
              activeOpacity={0.8}
              disabled={uploading !== null}
            >
              {uploading === 'banner' ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="pencil" size={12} color="#fff" />
              )}
            </TouchableOpacity>

            {/* Logo sobre o banner */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={() => pickAndUpload('logo')}
                activeOpacity={0.8}
                disabled={uploading !== null}
              >
                {logoUri ? (
                  <Image source={{ uri: logoUri }} style={styles.logoImg} />
                ) : (
                  <StoreAvatar nome={loja.nome || 'Loja'} size={58} />
                )}
                <View style={styles.avatarEditBtn}>
                  {uploading === 'logo' ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="camera-outline" size={10} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, { color: textColor }]}>{loja.nome}</Text>
            <Text style={[styles.storeCat, { color: subColor }]}>
              {loja.categoria} · {loja.bairro}
            </Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: abertaAgora ? '#046C2E' : colors.n600 },
                ]}
              />
              <Text style={[styles.statusText, { color: abertaAgora ? '#046C2E' : colors.n600 }]}>
                {abertaAgora ? 'Aberta agora' : 'Fechada agora'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>INFORMAÇÕES DA LOJA</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.fieldGroup}>
            <FormField
              label="NOME DA LOJA"
              value={loja.nome}
              onChange={(v) => updateLoja('nome', v)}
              dark={dark}
            />
            <CategoriaPicker
              value={loja.categoria}
              onChange={(v) => updateLoja('categoria', v)}
              dark={dark}
              categorias={CATEGORIAS}
            />
            <FormField
              label="DESCRIÇÃO"
              value={loja.descricao}
              onChange={(v) => updateLoja('descricao', v)}
              multiline
              dark={dark}
            />
            <FormField
              label="TELEFONE / WHATSAPP"
              value={loja.telefone}
              onChange={(v) => updateLoja('telefone', v.replace(/[^0-9+()\s-]/g, ''))}
              keyboardType="phone-pad"
              dark={dark}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>ENDEREÇO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.fieldGroup}>
            {/* Botão localização */}
            <TouchableOpacity
              style={[styles.locBtn, buscandoLoc && { opacity: 0.6 }]}
              onPress={usarLocalizacao}
              disabled={buscandoLoc}
              activeOpacity={0.8}
            >
              {buscandoLoc ? (
                <ActivityIndicator size="small" color={colors.orange} />
              ) : (
                <Ionicons name="navigate-outline" size={15} color={colors.orange} />
              )}
              <Text style={styles.locBtnTxt}>
                {buscandoLoc ? 'Buscando...' : 'Usar minha localização'}
              </Text>
            </TouchableOpacity>
            {!!erroLoc && <Text style={styles.locErro}>{erroLoc}</Text>}

            {/* CEP com autofill */}
            <View style={styles.field}>
              <Text style={[styles.fieldLabel, { color: subColor }]}>CEP</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      backgroundColor: dark ? 'rgba(255,255,255,0.05)' : colors.n50,
                      borderColor: dark ? 'rgba(255,255,255,0.08)' : colors.n200,
                      color: textColor,
                      flex: 1,
                    },
                  ]}
                  value={loja.cep}
                  onChangeText={(v) => {
                    const d = v.replace(/\D/g, '').slice(0, 8);
                    updateLoja('cep', d);
                    if (d.length === 8) buscarCep(d);
                  }}
                  placeholder="00000000"
                  placeholderTextColor={subColor}
                  keyboardType="numeric"
                  maxLength={8}
                />
                {buscandoCep && (
                  <ActivityIndicator size="small" color={colors.orange} style={{ marginLeft: 8 }} />
                )}
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={{ flex: 2 }}>
                <FormField
                  label="RUA"
                  value={loja.rua}
                  onChange={(v) => updateLoja('rua', v)}
                  placeholder="Nome da rua"
                  dark={dark}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="NÚMERO"
                  value={loja.numero}
                  onChange={(v) => updateLoja('numero', v.replace(/[^0-9]/g, ''))}
                  placeholder="Nº"
                  keyboardType="numeric"
                  dark={dark}
                />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <FormField
                  label="BAIRRO"
                  value={loja.bairro}
                  onChange={(v) => updateLoja('bairro', v)}
                  dark={dark}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FormField
                  label="CIDADE"
                  value={loja.cidade}
                  onChange={(v) => updateLoja('cidade', v)}
                  dark={dark}
                />
              </View>
            </View>

            <FormField
              label="COMPLEMENTO"
              value={loja.complemento}
              onChange={(v) => updateLoja('complemento', v)}
              placeholder="Nº da loja, Box, Sala, Apto..."
              dark={dark}
            />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>HORÁRIO DE FUNCIONAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <HorarioGrid horarios={horarios} onChange={updateHorario} dark={dark} />
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>AGENDAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.agendRow}>
            <View style={styles.agendInfo}>
              <Text style={[styles.agendTitle, { color: textColor }]}>
                Aceitar pedidos agendados
              </Text>
              <Text style={[styles.agendSub, { color: subColor }]}>
                Cliente escolhe data e hora fora do horário
              </Text>
            </View>
            <Toggle
              value={loja.aceitaAgendamento}
              onValueChange={(v) => updateLoja('aceitaAgendamento', v)}
            />
          </View>
          {loja.aceitaAgendamento && (
            <View style={[styles.agendRow, { borderTopWidth: 1, borderTopColor: border }]}>
              <View style={styles.agendInfo}>
                <Text style={[styles.agendTitle, { color: textColor }]}>
                  Antecedência mínima (minutos)
                </Text>
                <Text style={[styles.agendSub, { color: subColor }]}>
                  Ex: 60 = 1 hora, 120 = 2 horas
                </Text>
              </View>
              <TextInput
                style={[
                  styles.antecedenciaInput,
                  { borderColor: border, color: textColor, backgroundColor: colors.n50 },
                ]}
                value={loja.antecedenciaMinima}
                onChangeText={(v) => updateLoja('antecedenciaMinima', v.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
          )}
        </View>

        {/* ── Seção EQUIPE (só para o dono) ── */}
        {isLojistaDono && (
          <>
            <Text style={[styles.sectionLabel, { color: subColor }]}>EQUIPE</Text>
            <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
              {/* Header do card */}
              <View style={[styles.equipeHeader, { borderBottomColor: border }]}>
                <View>
                  <Text style={[styles.equipeHeaderTitle, { color: textColor }]}>
                    Colaboradores
                  </Text>
                  <Text style={[styles.equipeHeaderSub, { color: subColor }]}>
                    {colaboradores.length === 0
                      ? 'Nenhum colaborador cadastrado'
                      : `${colaboradores.filter((c) => c.ativo).length} ativo${colaboradores.filter((c) => c.ativo).length !== 1 ? 's' : ''} · ${colaboradores.length} no total`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.equipeAddBtn}
                  onPress={abrirCriarColaborador}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.equipeAddBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              {/* Lista */}
              {colaboradores.length === 0 ? (
                <View style={styles.equipeEmpty}>
                  <Ionicons name="people-outline" size={32} color={subColor} />
                  <Text style={[styles.equipeEmptyText, { color: subColor }]}>
                    Adicione colaboradores para compartilhar o acesso à loja com sua equipe.
                  </Text>
                </View>
              ) : (
                colaboradores.map((col, i) => {
                  const cfg = PAPEL_CFG[col.papel];
                  return (
                    <View
                      key={col.id}
                      style={[
                        styles.equipeItem,
                        { borderTopColor: border },
                        i === 0 && { borderTopWidth: 0 },
                        !col.ativo && { opacity: 0.5 },
                      ]}
                    >
                      {/* Avatar */}
                      <View style={[styles.equipeAvatar, { backgroundColor: cfg.bg }]}>
                        <Text style={[styles.equipeAvatarLetter, { color: cfg.cor }]}>
                          {col.nome.charAt(0).toUpperCase()}
                        </Text>
                      </View>

                      {/* Info */}
                      <TouchableOpacity
                        style={styles.equipeInfo}
                        onPress={() => abrirEditarColaborador(col)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.equipeNome, { color: textColor }]} numberOfLines={1}>
                          {col.nome}
                        </Text>
                        <Text style={[styles.equipeEmail, { color: subColor }]} numberOfLines={1}>
                          {col.email}
                        </Text>
                        <View style={[styles.equipePapelBadge, { backgroundColor: cfg.bg }]}>
                          <Text style={[styles.equipePapelText, { color: cfg.cor }]}>
                            {cfg.label}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Toggle ativo */}
                      <Toggle
                        value={col.ativo}
                        onValueChange={() => alternarAtivoColaborador(col)}
                      />
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}

        {(
          [
            {
              icon: 'chatbubbles-outline',
              label: 'Conversas',
              onPress: () => router.navigate('/(lojista)/conversas' as any),
            },
            {
              icon: 'star-outline',
              label: 'Avaliações',
              onPress: () => router.navigate('/(lojista)/avaliacoes' as any),
            },
            {
              icon: 'notifications-outline',
              label: 'Notificações',
              onPress: () => router.navigate('/(lojista)/notificacoes' as any),
            },
          ] as { icon: string; label: string; onPress: () => void }[]
        ).map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItemBtn, { backgroundColor: surface, borderColor: border }]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconBox, { backgroundColor: colors.orange + '18' }]}>
              <Ionicons name={item.icon as any} size={17} color={colors.orange} />
            </View>
            <Text style={[styles.menuLabel, { color: textColor }]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={16} color={subColor} />
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionLabel, { color: subColor }]}>PREFERÊNCIAS</Text>
        <View style={[styles.prefRow, { backgroundColor: surface, borderColor: border }]}>
          <View style={[styles.prefIcon, { backgroundColor: theme.iconBg }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny'} size={17} color={colors.orange} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.menuLabel, { color: textColor }]}>Modo escuro</Text>
            <Text style={[styles.prefHint, { color: subColor }]}>
              {isDark ? 'Ativado' : 'Desativado'}
            </Text>
          </View>
          <Toggle value={isDark} onValueChange={toggleDark} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#E24B4A" />
          <Text style={styles.logoutBtnText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: isDirty ? 96 : 24 }} />
      </ScrollView>

      {/* ── Barra unificada: não salvo / salvo ── */}
      {(isDirty || saveSuccess) && (
        <View style={[styles.stickyBar, saveSuccess && styles.stickyBarSuccess]}>
          {saveSuccess ? (
            <View style={styles.stickySuccessContent}>
              <View style={styles.stickySuccessIconWrap}>
                <Ionicons name="checkmark" size={16} color="#16A34A" />
              </View>
              <View>
                <Text style={styles.stickySuccessTitle}>Alterações salvas!</Text>
                <Text style={styles.stickySuccessSub}>Informações da loja atualizadas</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.stickyInfo}>
                <View style={styles.stickyDot} />
                <Text style={styles.stickyInfoText}>Alterações não salvas</Text>
              </View>
              <View style={styles.stickyActions}>
                <TouchableOpacity
                  onPress={handleDescartar}
                  style={styles.discardBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.discardBtnText}>Descartar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSalvar}
                  style={[styles.saveBarBtn, saving && { opacity: 0.7 }]}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveBarBtnText}>Salvar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      )}

      <EquipeFormModal
        visible={equipeModal}
        onClose={() => setEquipeModal(false)}
        editandoCol={editandoCol}
        formCol={formCol}
        setFormCol={setFormCol}
        salvandoCol={salvandoCol}
        erroCol={erroCol}
        senhaVisivel={senhaVisivel}
        setSenhaVisivel={setSenhaVisivel}
        onSalvar={salvarColaborador}
      />

      <LogoutModal
        visible={logoutVisible}
        onClose={() => setLogoutVisible(false)}
        onConfirm={() => {
          setLogoutVisible(false);
          logout();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F1F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
  headerSub: { fontSize: 12, marginTop: 2 },
  content: { padding: 14, gap: 8 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', backgroundColor: '#fff' },
  banner: { height: 90, position: 'relative' },
  bannerEditBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: { position: 'absolute', bottom: -22, left: 14 },
  avatarTouchable: { position: 'relative' },
  logoImg: { width: 58, height: 58, borderRadius: 14, borderWidth: 3, borderColor: '#fff' },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  storeInfo: { paddingTop: 28, padding: 14 },
  storeName: { fontSize: 16, fontWeight: '700' },
  storeCat: { fontSize: 12, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  fieldGroup: { padding: 14, gap: 12 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: colors.orange100,
  },
  locBtnTxt: { fontSize: 13, fontWeight: '600', color: colors.orange },
  locErro: { fontSize: 11, color: '#E24B4A', fontWeight: '500' },
  field: { gap: 5 },
  fieldLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  agendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    gap: 12,
  },
  agendInfo: { flex: 1 },
  agendTitle: { fontSize: 14, fontWeight: '600' },
  agendSub: { fontSize: 11, marginTop: 2 },
  antecedenciaInput: {
    width: 80,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 12,
  },
  stickyInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stickyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DE6708' },
  stickyInfoText: { fontSize: 13, fontWeight: '600', color: '#000933' },
  stickyActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  discardBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  discardBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  saveBarBtn: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#DE6708',
    minWidth: 72,
    alignItems: 'center',
  },
  saveBarBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  stickyBarSuccess: { backgroundColor: '#fff', borderTopColor: '#BBF7D0' },
  stickySuccessContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stickySuccessIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickySuccessTitle: { fontSize: 14, fontWeight: '700', color: '#15803D' },
  stickySuccessSub: { fontSize: 11, color: '#4ADE80', marginTop: 1 },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  prefIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefHint: { fontSize: 12, marginTop: 1 },
  menuIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },
  logoutBtn: {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E24B4A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  logoutBtnText: { fontSize: 15, fontWeight: '700', color: '#E24B4A' },

  // ── Seção equipe ─────────────────────────────────────────────
  equipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
  },
  equipeHeaderTitle: { fontSize: 15, fontWeight: '700' },
  equipeHeaderSub: { fontSize: 12, marginTop: 2 },
  equipeAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.orange,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  equipeAddBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  equipeEmpty: { padding: 24, alignItems: 'center', gap: 10 },
  equipeEmptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },

  equipeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  equipeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  equipeAvatarLetter: { fontSize: 18, fontWeight: '800' },
  equipeInfo: { flex: 1 },
  equipeNome: { fontSize: 14, fontWeight: '700' },
  equipeEmail: { fontSize: 12, marginTop: 1 },
  equipePapelBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  equipePapelText: { fontSize: 11, fontWeight: '700' },
});
