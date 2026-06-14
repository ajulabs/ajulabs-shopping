import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService, RBACService } from '@ajulabs/api-client';
import type { Colaborador, PapelColaborador } from '@ajulabs/types';
import { colors } from '../../../../theme';
import { useAuthLojistaStore } from '../../auth/model/store';

interface HorarioDia {
  dia: string;
  abreviacao: string;
  ativo: boolean;
  abertura: string;
  fechamento: string;
}

interface LojaData {
  nome: string;
  categoria: string;
  descricao: string;
  telefone: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cep: string;
  cidade: string;
  aceitaAgendamento: boolean;
  antecedenciaMinima: string;
}

interface PerfilLojaProps {
  dark?: boolean;
}

interface CategoriaItem {
  label: string;
  icone: string;
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

const HORARIOS_INICIAIS: HorarioDia[] = [
  { dia: 'Segunda-feira', abreviacao: 'Seg', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Terça-feira', abreviacao: 'Ter', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quarta-feira', abreviacao: 'Qua', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quinta-feira', abreviacao: 'Qui', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sexta-feira', abreviacao: 'Sex', ativo: true, abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sábado', abreviacao: 'Sáb', ativo: true, abertura: '09:00', fechamento: '14:00' },
  { dia: 'Domingo', abreviacao: 'Dom', ativo: false, abertura: '--:--', fechamento: '--:--' },
];

function Toggle({
  value,
  onValueChange,
  activeColor = colors.orange,
}: {
  value: boolean;
  onValueChange: (v: boolean) => void;
  activeColor?: string;
}) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      activeOpacity={0.85}
      style={[styles.toggleTrack, { backgroundColor: value ? activeColor : colors.n300 }]}
    >
      <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 22 : 2 }] }]} />
    </TouchableOpacity>
  );
}

function formatarHora(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  keyboardType = 'default',
  dark,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  dark: boolean;
}) {
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: subColor }]}>{label}</Text>
      <TextInput
        style={[
          styles.fieldInput,
          { backgroundColor: inputBg, borderColor: border, color: textColor },
          multiline && { minHeight: 70, textAlignVertical: 'top' },
        ]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={subColor}
        multiline={multiline}
        keyboardType={keyboardType}
      />
    </View>
  );
}

function HorarioGrid({
  horarios,
  onChange,
  dark,
}: {
  horarios: HorarioDia[];
  onChange: (index: number, updated: HorarioDia) => void;
  dark: boolean;
}) {
  const [sel, setSel] = useState(0);
  const h = horarios[sel];

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.45)' : colors.n500;
  const inputBg = dark ? 'rgba(255,255,255,0.07)' : colors.n0;
  const inputBorder = dark ? 'rgba(255,255,255,0.14)' : colors.n200;
  const panelDiv = dark ? 'rgba(255,255,255,0.08)' : colors.n100;

  return (
    <View>
      {/* ── Strip de dias ───────────────────────── */}
      <View style={styles.weekStrip}>
        {horarios.map((day, i) => {
          const isSelected = sel === i;
          return (
            <TouchableOpacity
              key={day.dia}
              style={[
                styles.dayPill,
                day.ativo && !isSelected && styles.dayPillActive,
                isSelected && styles.dayPillSelected,
              ]}
              onPress={() => setSel(i)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayPillText,
                  day.ativo && !isSelected && styles.dayPillTextActive,
                  isSelected && styles.dayPillTextSelected,
                ]}
              >
                {day.abreviacao}
              </Text>
              <View
                style={[
                  styles.dayPillDot,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(255,255,255,0.55)'
                      : day.ativo
                        ? colors.orange
                        : colors.n300,
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Painel de edição ────────────────────── */}
      <View style={[styles.dayEditPanel, { borderTopColor: panelDiv }]}>
        {/* Cabeçalho: nome + toggle */}
        <View style={styles.dayEditHead}>
          <View style={{ gap: 3 }}>
            <Text style={[styles.dayEditName, { color: textColor }]}>{h.dia}</Text>
            <View style={styles.dayEditStatusRow}>
              <View
                style={[
                  styles.dayEditDot,
                  { backgroundColor: h.ativo ? colors.orange : colors.n300 },
                ]}
              />
              <Text style={[styles.dayEditStatus, { color: h.ativo ? colors.orange : subColor }]}>
                {h.ativo ? 'Aberto neste dia' : 'Fechado neste dia'}
              </Text>
            </View>
          </View>
          <Toggle
            value={h.ativo}
            onValueChange={(v) =>
              onChange(sel, {
                ...h,
                ativo: v,
                abertura: v ? '08:00' : '--:--',
                fechamento: v ? '18:00' : '--:--',
              })
            }
          />
        </View>

        {/* Inputs de horário ou mensagem fechado */}
        {h.ativo ? (
          <View style={styles.dayEditTimes}>
            <View style={styles.dayTimeSlot}>
              <Text style={[styles.dayTimeSlotLabel, { color: subColor }]}>ABERTURA</Text>
              <TextInput
                style={[
                  styles.dayTimeSlotInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                ]}
                value={h.abertura}
                onChangeText={(v) => onChange(sel, { ...h, abertura: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={subColor}
              />
            </View>

            <View style={styles.dayTimeArrow}>
              <View style={[styles.dayTimeArrowLine, { backgroundColor: panelDiv }]} />
              <Ionicons name="arrow-forward-outline" size={16} color={subColor} />
              <View style={[styles.dayTimeArrowLine, { backgroundColor: panelDiv }]} />
            </View>

            <View style={styles.dayTimeSlot}>
              <Text style={[styles.dayTimeSlotLabel, { color: subColor }]}>FECHAMENTO</Text>
              <TextInput
                style={[
                  styles.dayTimeSlotInput,
                  { backgroundColor: inputBg, borderColor: inputBorder, color: textColor },
                ]}
                value={h.fechamento}
                onChangeText={(v) => onChange(sel, { ...h, fechamento: formatarHora(v) })}
                keyboardType="numeric"
                maxLength={5}
                placeholder="00:00"
                placeholderTextColor={subColor}
              />
            </View>
          </View>
        ) : (
          <View style={styles.dayClosedMsg}>
            <Ionicons name="moon-outline" size={22} color={subColor} />
            <Text style={[styles.dayClosedTxt, { color: subColor }]}>
              Sem horário configurado para este dia
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function StoreAvatar({ nome, size = 56 }: { nome: string; size?: number }) {
  const initials = nome
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function CategoriaPicker({
  value,
  onChange,
  dark,
}: {
  value: string;
  onChange: (v: string) => void;
  dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border = dark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const selected = CATEGORIAS.find((c) => c.label === value);

  return (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: subColor }]}>CATEGORIA</Text>
        <TouchableOpacity
          style={[
            styles.fieldInput,
            styles.catSelector,
            { backgroundColor: inputBg, borderColor: border },
          ]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {selected ? (
            <>
              <Ionicons
                name={selected.icone as any}
                size={18}
                color={textColor}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.catSelectorText, { color: textColor }]}>{selected.label}</Text>
            </>
          ) : (
            <Text style={[styles.catSelectorText, { color: subColor }]}>
              Selecione uma categoria
            </Text>
          )}
          <Ionicons name="chevron-down" size={16} color={subColor} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={open}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.catModal}>
          <View style={styles.catModalHeader}>
            <Text style={styles.catModalTitle}>Categoria da loja</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIAS}
            keyExtractor={(item) => item.label}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catItem, item.label === value && styles.catItemSelected]}
                onPress={() => {
                  onChange(item.label);
                  setOpen(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icone as any}
                  size={20}
                  color={item.label === value ? colors.orange : colors.n600}
                  style={styles.catItemIcone}
                />
                <Text
                  style={[
                    styles.catItemLabel,
                    item.label === value && { color: colors.orange, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </Text>
                {item.label === value && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
                )}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

const PAPEL_CFG: Record<PapelColaborador, { label: string; cor: string; bg: string }> = {
  admin: { label: 'Admin', cor: '#7C3AED', bg: '#F3E8FF' },
  gerente: { label: 'Gerente', cor: '#2563EB', bg: '#DBEAFE' },
  funcionario: { label: 'Funcionário', cor: '#059669', bg: '#D1FAE5' },
};

const PAPEIS: PapelColaborador[] = ['admin', 'gerente', 'funcionario'];

interface FormColaborador {
  nome: string;
  email: string;
  senha: string;
  papel: PapelColaborador;
}

const FORM_VAZIO: FormColaborador = { nome: '', email: '', senha: '', papel: 'funcionario' };

type Section = null | 'visual' | 'info' | 'endereco' | 'horarios' | 'agendamento' | 'equipe';

const SECTION_TITLES: Record<Exclude<Section, null>, string> = {
  visual: 'Identidade visual',
  info: 'Informações',
  endereco: 'Endereço',
  horarios: 'Horário de funcionamento',
  agendamento: 'Agendamento',
  equipe: 'Equipe',
};

export function PerfilLoja({ dark = false }: PerfilLojaProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useAuthLojistaStore((s) => s.token);
  const lojaId = useAuthLojistaStore((s) => s.lojaId);
  const logout = useAuthLojistaStore((s) => s.logout);
  const isLojistaDono = useAuthLojistaStore((s) => s.isLojistaDono);

  // ── Equipe ─────────────────────────────────────────────────────
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [equipeModal, setEquipeModal] = useState(false);
  const [editandoCol, setEditandoCol] = useState<Colaborador | null>(null);
  const [formCol, setFormCol] = useState<FormColaborador>(FORM_VAZIO);
  const [salvandoCol, setSalvandoCol] = useState(false);
  const [erroCol, setErroCol] = useState('');
  const [senhaVisivel, setSenhaVisivel] = useState(false);
  // ──────────────────────────────────────────────────────────────

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const originalLojaRef = useRef<LojaData | null>(null);
  const originalHorariosRef = useRef<HorarioDia[]>(HORARIOS_INICIAIS);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [horarios, setHorarios] = useState<HorarioDia[]>(HORARIOS_INICIAIS);
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [bannerUri, setBannerUri] = useState<string | null>(null);
  const [loja, setLoja] = useState<LojaData>({
    nome: '',
    categoria: '',
    descricao: '',
    telefone: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cep: '',
    cidade: '',
    aceitaAgendamento: false,
    antecedenciaMinima: '120',
  });

  useEffect(() => {
    if (!token || !lojaId) {
      setLoading(false);
      return;
    }
    LojistaService.buscarLojaDetalhes(lojaId, token)
      .then((raw) => {
        if (!raw) return;
        const lojaData: LojaData = {
          nome: raw.nome ?? '',
          categoria: raw.categoria ?? '',
          descricao: raw.descricao ?? '',
          telefone: raw.telefone ?? '',
          rua: raw.endereco?.rua ?? '',
          numero: raw.endereco?.numero ?? '',
          complemento: raw.endereco?.complemento ?? '',
          bairro: raw.endereco?.bairro ?? '',
          cep: raw.endereco?.cep ?? '',
          cidade: raw.endereco?.cidade ?? '',
          aceitaAgendamento: raw.aceitaAgendamento ?? false,
          antecedenciaMinima: String(raw.antecedenciaMinima ?? 120),
        };
        setLoja(lojaData);
        originalLojaRef.current = lojaData;
        if (raw.logoUrl) setLogoUri(raw.logoUrl);
        if (raw.bannerUrl) setBannerUri(raw.bannerUrl);
        if (raw.horarios && raw.horarios.length > 0) {
          const horariosData = HORARIOS_INICIAIS.map((h, i) => {
            const bh = raw.horarios.find((x: any) => x.diaSemana === i);
            if (!bh) return h;
            return { ...h, ativo: bh.ativo, abertura: bh.abertura, fechamento: bh.fechamento };
          });
          setHorarios(horariosData);
          originalHorariosRef.current = horariosData;
        } else {
          originalHorariosRef.current = [...HORARIOS_INICIAIS];
        }
      })
      .finally(() => setLoading(false));

    // carrega colaboradores (só para o dono)
    if (isLojistaDono) {
      RBACService.listarColaboradores(lojaId, token)
        .then(setColaboradores)
        .catch(() => {});
    }
  }, [token, lojaId, isLojistaDono]);

  const carregarColaboradores = useCallback(() => {
    if (!lojaId || !token || !isLojistaDono) return;
    RBACService.listarColaboradores(lojaId, token)
      .then(setColaboradores)
      .catch(() => {});
  }, [lojaId, token, isLojistaDono]);

  const abrirCriarColaborador = useCallback(() => {
    setEditandoCol(null);
    setFormCol(FORM_VAZIO);
    setErroCol('');
    setSenhaVisivel(false);
    setEquipeModal(true);
  }, []);

  const abrirEditarColaborador = useCallback((col: Colaborador) => {
    setEditandoCol(col);
    setFormCol({ nome: col.nome, email: col.email, senha: '', papel: col.papel });
    setErroCol('');
    setSenhaVisivel(false);
    setEquipeModal(true);
  }, []);

  const salvarColaborador = useCallback(async () => {
    if (!formCol.nome.trim() || !formCol.email.trim()) {
      setErroCol('Nome e email são obrigatórios.');
      return;
    }
    if (!editandoCol && !formCol.senha.trim()) {
      setErroCol('Informe uma senha para o novo colaborador.');
      return;
    }
    if (!lojaId || !token) return;
    setSalvandoCol(true);
    setErroCol('');
    try {
      if (editandoCol) {
        await RBACService.atualizarColaborador(editandoCol.id, lojaId, token, {
          nome: formCol.nome.trim(),
          papel: formCol.papel,
          ativo: editandoCol.ativo,
          ...(formCol.senha.trim() ? { senha: formCol.senha.trim() } : {}),
        });
      } else {
        await RBACService.criarColaborador(lojaId, token, {
          nome: formCol.nome.trim(),
          email: formCol.email.trim(),
          senha: formCol.senha.trim(),
          papel: formCol.papel,
        });
      }
      setEquipeModal(false);
      carregarColaboradores();
    } catch (e) {
      setErroCol(e instanceof Error ? e.message : 'Erro ao salvar.');
    } finally {
      setSalvandoCol(false);
    }
  }, [formCol, editandoCol, lojaId, token, carregarColaboradores]);

  const alternarAtivoColaborador = useCallback(
    async (col: Colaborador) => {
      if (!lojaId || !token) return;
      try {
        await RBACService.atualizarColaborador(col.id, lojaId, token, { ativo: !col.ativo });
        carregarColaboradores();
      } catch {
        Alert.alert('Erro', 'Não foi possível alterar o status.');
      }
    },
    [lojaId, token, carregarColaboradores],
  );

  const textColor = dark ? colors.n0 : colors.navy;
  const subColor = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain = dark ? '#0B0F22' : colors.n50;
  const surface = dark ? '#111638' : colors.n0;
  const border = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');

  const updateLoja = useCallback((key: keyof LojaData, value: string | boolean) => {
    setLoja((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buscarCep = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        Alert.alert('CEP não encontrado');
        return;
      }
      setLoja((prev) => ({
        ...prev,
        rua: data.logradouro || prev.rua,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
      }));
    } catch {
      Alert.alert('Erro', 'Não foi possível buscar o CEP.');
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  const usarLocalizacao = async () => {
    setBuscandoLoc(true);
    setErroLoc('');
    try {
      let latitude: number;
      let longitude: number;
      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          setErroLoc('Geolocalização não suportada.');
          return;
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErroLoc('Permita o acesso à localização.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'AjuLabsShopping/1.0' } },
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const cep = (addr.postcode ?? '').replace(/\D/g, '').slice(0, 8);
      setLoja((prev) => ({
        ...prev,
        rua: addr.road || addr.pedestrian || prev.rua,
        bairro: addr.suburb || addr.neighbourhood || prev.bairro,
        cidade: addr.city || addr.town || prev.cidade,
        cep: cep || prev.cep,
      }));
    } catch (e: any) {
      const msg =
        e?.code === 1
          ? 'Permissão negada.'
          : e?.code === 3
            ? 'Tempo esgotado.'
            : 'Não foi possível obter localização.';
      setErroLoc(msg);
    } finally {
      setBuscandoLoc(false);
    }
  };

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios((prev) => prev.map((h, i) => (i === index ? updated : h)));
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutVisible(true);
  }, []);

  const pickAndUpload = useCallback(
    async (tipo: 'logo' | 'banner') => {
      if (!token || !lojaId) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: tipo === 'logo' ? [1, 1] : [3, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const uri = result.assets[0].uri;

      // preview local imediato
      if (tipo === 'logo') setLogoUri(uri);
      else setBannerUri(uri);

      setUploading(tipo);
      try {
        await LojistaService.atualizarImagemLoja(lojaId, token, tipo, uri);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Não foi possível fazer o upload. Tente novamente.';
        Alert.alert('Erro ao enviar imagem', msg);
        if (tipo === 'logo') setLogoUri(null);
        else setBannerUri(null);
      } finally {
        setUploading(null);
      }
    },
    [token, lojaId],
  );

  const [savedVersion, setSavedVersion] = useState(0);

  const isDirty = useMemo(() => {
    if (!originalLojaRef.current) return false;
    return (
      JSON.stringify(loja) !== JSON.stringify(originalLojaRef.current) ||
      JSON.stringify(horarios) !== JSON.stringify(originalHorariosRef.current)
    );
    // savedVersion força re-execução do memo após salvar, sem alterar loja/horarios
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loja, horarios, savedVersion]);

  const handleDescartar = useCallback(() => {
    if (!originalLojaRef.current) return;
    setLoja({ ...originalLojaRef.current });
    setHorarios(originalHorariosRef.current.map((h) => ({ ...h })));
  }, []);

  const handleSalvar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida.');
      return;
    }
    setSaving(true);
    try {
      await LojistaService.atualizarLoja(lojaId, token, {
        nome: loja.nome,
        descricao: loja.descricao,
        categoria: loja.categoria,
        telefone: loja.telefone,
        aceitaAgendamento: loja.aceitaAgendamento,
        antecedenciaMinima: parseInt(loja.antecedenciaMinima, 10) || 120,
        horarios: horarios.map((h, i) => ({
          diaSemana: i,
          ativo: h.ativo,
          abertura: h.abertura,
          fechamento: h.fechamento,
        })),
        ...(loja.bairro || loja.cep || loja.cidade
          ? {
              endereco: {
                rua: loja.rua,
                numero: loja.numero,
                complemento: loja.complemento,
                bairro: loja.bairro,
                cep: loja.cep,
                cidade: loja.cidade,
              },
            }
          : {}),
      });
      originalLojaRef.current = { ...loja };
      originalHorariosRef.current = horarios.map((h) => ({ ...h }));
      setSavedVersion((v) => v + 1);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, loja, horarios]);

  const hoje = new Date();
  const diaSemana = hoje.getDay();
  const mapDia = [6, 0, 1, 2, 3, 4, 5];
  const horarioHoje = horarios[mapDia[diaSemana]];
  const agoraMin = hoje.getHours() * 60 + hoje.getMinutes();
  const [aH, aM] = (horarioHoje?.abertura || '00:00').split(':').map(Number);
  const [fH, fM] = (horarioHoje?.fechamento || '00:00').split(':').map(Number);
  const abertaAgora = horarioHoje?.ativo && agoraMin >= aH * 60 + aM && agoraMin < fH * 60 + fM;

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

      {/* ── Modal criar/editar colaborador ── */}
      <Modal
        visible={equipeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEquipeModal(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setEquipeModal(false)}
        >
          <TouchableOpacity style={styles.sheetContainer} activeOpacity={1} onPress={() => {}}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>
              {editandoCol ? 'Editar colaborador' : 'Novo colaborador'}
            </Text>

            {/* Nome */}
            <View style={styles.sheetField}>
              <Text style={styles.sheetFieldLabel}>NOME</Text>
              <TextInput
                style={styles.sheetInput}
                value={formCol.nome}
                onChangeText={(v) => setFormCol((f) => ({ ...f, nome: v }))}
                placeholder="Nome completo"
                placeholderTextColor={colors.n500}
              />
            </View>

            {/* Email (só na criação) */}
            {!editandoCol && (
              <View style={styles.sheetField}>
                <Text style={styles.sheetFieldLabel}>EMAIL</Text>
                <TextInput
                  style={styles.sheetInput}
                  value={formCol.email}
                  onChangeText={(v) => setFormCol((f) => ({ ...f, email: v }))}
                  placeholder="email@colaborador.com"
                  placeholderTextColor={colors.n500}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            )}

            {/* Senha */}
            <View style={styles.sheetField}>
              <Text style={styles.sheetFieldLabel}>
                {editandoCol ? 'NOVA SENHA (opcional)' : 'SENHA'}
              </Text>
              <View style={styles.sheetInputRow}>
                <TextInput
                  style={styles.sheetInputInner}
                  value={formCol.senha}
                  onChangeText={(v) => setFormCol((f) => ({ ...f, senha: v }))}
                  placeholder="••••••••"
                  placeholderTextColor={colors.n500}
                  secureTextEntry={!senhaVisivel}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setSenhaVisivel((s) => !s)} hitSlop={10}>
                  <Ionicons
                    name={senhaVisivel ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={colors.n500}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Seletor de papel */}
            <Text style={[styles.sheetFieldLabel, { marginBottom: 8 }]}>NÍVEL DE ACESSO</Text>
            <View style={styles.papelGrid}>
              {PAPEIS.map((p) => {
                const cfg = PAPEL_CFG[p];
                const ativo = formCol.papel === p;
                return (
                  <TouchableOpacity
                    key={p}
                    style={[
                      styles.papelCard,
                      ativo && { borderColor: cfg.cor, backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setFormCol((f) => ({ ...f, papel: p }))}
                    activeOpacity={0.8}
                  >
                    <View style={styles.papelCardTop}>
                      <Text style={[styles.papelCardLabel, ativo && { color: cfg.cor }]}>
                        {cfg.label}
                      </Text>
                      {ativo && <Ionicons name="checkmark-circle" size={16} color={cfg.cor} />}
                    </View>
                    <Text style={styles.papelCardDesc}>
                      {p === 'admin'
                        ? 'Acesso total, gerencia equipe e preços'
                        : p === 'gerente'
                          ? 'Gerencia produtos e aprova preços'
                          : 'Operacional, solicita mudança de preço'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {!!erroCol && <Text style={styles.sheetErro}>{erroCol}</Text>}

            <TouchableOpacity
              style={[styles.sheetSalvarBtn, salvandoCol && { opacity: 0.7 }]}
              onPress={salvarColaborador}
              disabled={salvandoCol}
              activeOpacity={0.85}
            >
              {salvandoCol ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.sheetSalvarText}>
                  {editandoCol ? 'Salvar alterações' : 'Criar colaborador'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetCancelarBtn}
              onPress={() => setEquipeModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.sheetCancelarText}>Cancelar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Modal de confirmação de logout */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="log-out-outline" size={28} color="#E24B4A" />
            </View>
            <Text style={styles.modalTitle}>Sair da conta</Text>
            <Text style={styles.modalMsg}>
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua
              conta.
            </Text>
            <TouchableOpacity
              style={styles.modalBtnSair}
              onPress={() => {
                setLogoutVisible(false);
                logout();
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnSairText}>Sim, quero sair</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalBtnCancel}
              onPress={() => setLogoutVisible(false)}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  avatar: {
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: { color: '#fff', fontWeight: '700' },
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
  // ── Toggle customizado ───────────────────────
  toggleTrack: { width: 48, height: 28, borderRadius: 14, justifyContent: 'center' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },

  // ── HorarioGrid ─────────────────────────────
  weekStrip: { flexDirection: 'row', padding: 12, gap: 5 },

  dayPill: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.n100,
  },
  dayPillActive: { backgroundColor: colors.orange100 },
  dayPillSelected: { backgroundColor: colors.navy },
  dayPillText: { fontSize: 11, fontWeight: '800', color: colors.n500 },
  dayPillTextActive: { color: colors.orange600 },
  dayPillTextSelected: { color: '#fff' },
  dayPillDot: { width: 5, height: 5, borderRadius: 2.5 },

  dayEditPanel: { borderTopWidth: 1, padding: 16, gap: 18 },
  dayEditHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayEditName: { fontSize: 17, fontWeight: '800' },
  dayEditStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dayEditDot: { width: 7, height: 7, borderRadius: 3.5 },
  dayEditStatus: { fontSize: 12, fontWeight: '600' },

  dayEditTimes: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dayTimeSlot: { flex: 1, gap: 8 },
  dayTimeSlotLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  dayTimeSlotInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 8,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  dayTimeArrow: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingBottom: 17 },
  dayTimeArrowLine: { width: 10, height: 1.5, borderRadius: 1 },

  dayClosedMsg: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  dayClosedTxt: { fontSize: 13, flex: 1 },
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
  menuCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
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
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuRowBorder: { borderBottomWidth: 1 },
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
  // Modal de logout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(226,75,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#000933', marginBottom: 8 },
  modalMsg: {
    fontSize: 14,
    color: '#5A6480',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  modalBtnSair: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: '#E24B4A',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalBtnSairText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
    alignItems: 'center',
  },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#5A6480' },

  // CategoriaPicker
  catSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46,
    paddingHorizontal: 12,
  },
  catSelectorText: { fontSize: 14, flex: 1 },
  catModal: { flex: 1, backgroundColor: '#fff' },
  catModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.n200,
  },
  catModalTitle: { fontSize: 17, fontWeight: '700', color: colors.navy },
  catItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.n100,
  },
  catItemSelected: { backgroundColor: 'rgba(242,118,15,0.07)' },
  catItemIcone: { width: 28, textAlign: 'center' },
  catItemLabel: { flex: 1, fontSize: 15, color: colors.navy },

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

  // ── Modal criar/editar colaborador ───────────────────────────
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,9,51,0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.n200,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 19, fontWeight: '800', color: colors.navy, marginBottom: 20 },

  sheetField: { marginBottom: 14 },
  sheetFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  sheetInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.navy,
  },
  sheetInputRow: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  sheetInputInner: { flex: 1, fontSize: 14, color: colors.navy },

  papelGrid: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  papelCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    backgroundColor: colors.n50,
    padding: 10,
  },
  papelCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  papelCardLabel: { fontSize: 12, fontWeight: '800', color: colors.navy },
  papelCardDesc: { fontSize: 10, color: colors.n600, lineHeight: 14 },

  sheetErro: { fontSize: 12, color: '#E24B4A', marginBottom: 10, fontWeight: '500' },

  sheetSalvarBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSalvarText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  sheetCancelarBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.n200,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  sheetCancelarText: { fontSize: 14, fontWeight: '600', color: colors.n600 },
});
