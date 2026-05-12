import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  StyleSheet, Switch, Alert, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LojistaService } from '@ajulabs/api-client';
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

interface CategoriaItem { label: string; icone: string; }

const CATEGORIAS: CategoriaItem[] = [
  { label: 'Alimentação',              icone: 'restaurant-outline'      },
  { label: 'Padaria e Confeitaria',    icone: 'cafe-outline'            },
  { label: 'Açougue e Peixaria',       icone: 'fish-outline'            },
  { label: 'Hortifrúti',               icone: 'leaf-outline'            },
  { label: 'Bebidas',                  icone: 'wine-outline'            },
  { label: 'Calçados',                 icone: 'footsteps-outline'       },
  { label: 'Roupas e Acessórios',      icone: 'shirt-outline'           },
  { label: 'Moda Infantil',            icone: 'happy-outline'           },
  { label: 'Moda Praia e Esporte',     icone: 'water-outline'           },
  { label: 'Bijuterias e Joias',       icone: 'diamond-outline'         },
  { label: 'Cosméticos e Beleza',      icone: 'color-palette-outline'   },
  { label: 'Farmácia',                 icone: 'medkit-outline'          },
  { label: 'Ótica',                    icone: 'glasses-outline'         },
  { label: 'Eletrônicos',              icone: 'phone-portrait-outline'  },
  { label: 'Informática',              icone: 'laptop-outline'          },
  { label: 'Eletrodomésticos',         icone: 'home-outline'            },
  { label: 'Móveis e Decoração',       icone: 'bed-outline'             },
  { label: 'Papelaria e Livraria',     icone: 'book-outline'            },
  { label: 'Brinquedos e Games',       icone: 'game-controller-outline' },
  { label: 'Esportes e Lazer',         icone: 'football-outline'        },
  { label: 'Pet Shop',                 icone: 'paw-outline'             },
  { label: 'Ferragens e Construção',   icone: 'construct-outline'       },
  { label: 'Floricultura',             icone: 'flower-outline'          },
  { label: 'Serviços',                 icone: 'build-outline'           },
  { label: 'Outros',                   icone: 'storefront-outline'      },
];

const HORARIOS_INICIAIS: HorarioDia[] = [
  { dia: 'Segunda-feira',  abreviacao: 'Seg', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Terça-feira',   abreviacao: 'Ter', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quarta-feira',  abreviacao: 'Qua', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Quinta-feira',  abreviacao: 'Qui', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sexta-feira',   abreviacao: 'Sex', ativo: true,  abertura: '08:00', fechamento: '18:00' },
  { dia: 'Sábado',        abreviacao: 'Sáb', ativo: true,  abertura: '09:00', fechamento: '14:00' },
  { dia: 'Domingo',       abreviacao: 'Dom', ativo: false, abertura: '--:--', fechamento: '--:--' },
];

function formatarHora(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function FormField({
  label, value, onChange, placeholder, multiline = false,
  keyboardType = 'default', dark,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'numeric';
  dark: boolean;
}) {
  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg   = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border    = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

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

function HorarioRow({
  horario, onChange, dark,
}: {
  horario: HorarioDia;
  onChange: (updated: HorarioDia) => void;
  dark: boolean;
}) {
  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg   = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border    = dark ? 'rgba(255,255,255,0.08)' : colors.n200;

  return (
    <View style={styles.dayRow}>
      {/* Linha 1: dia + switch */}
      <View style={styles.dayTopRow}>
        <Text style={[styles.dayName, { color: textColor }]}>{horario.abreviacao}</Text>
        <Switch
          value={horario.ativo}
          onValueChange={v => onChange({
            ...horario, ativo: v,
            abertura:   v ? '08:00' : '--:--',
            fechamento: v ? '18:00' : '--:--',
          })}
          trackColor={{ false: colors.n200, true: '#046C2E' }}
          thumbColor="#fff"
          style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
        />
      </View>
      {/* Linha 2: inputs de horário */}
      <View style={[styles.dayTimeRow, !horario.ativo && { opacity: 0.4 }]}>
        <Text style={[styles.timeRangeLabel, { color: subColor }]}>Abertura</Text>
        <TextInput
          style={[styles.timeInput, { backgroundColor: inputBg, borderColor: border, color: textColor }]}
          value={horario.abertura}
          onChangeText={v => onChange({ ...horario, abertura: formatarHora(v) })}
          editable={horario.ativo}
          keyboardType="numeric"
          maxLength={5}
          placeholder="08:00"
          placeholderTextColor={subColor}
        />
        <Text style={[styles.timeSep, { color: subColor }]}>–</Text>
        <Text style={[styles.timeRangeLabel, { color: subColor }]}>Fechamento</Text>
        <TextInput
          style={[styles.timeInput, { backgroundColor: inputBg, borderColor: border, color: textColor }]}
          value={horario.fechamento}
          onChangeText={v => onChange({ ...horario, fechamento: formatarHora(v) })}
          editable={horario.ativo}
          keyboardType="numeric"
          maxLength={5}
          placeholder="18:00"
          placeholderTextColor={subColor}
        />
      </View>
    </View>
  );
}

function StoreAvatar({ nome, size = 56 }: { nome: string; size?: number }) {
  const initials = nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size * 0.25 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.32 }]}>{initials}</Text>
    </View>
  );
}

function CategoriaPicker({
  value, onChange, dark,
}: {
  value: string; onChange: (v: string) => void; dark: boolean;
}) {
  const [open, setOpen] = useState(false);
  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const inputBg   = dark ? 'rgba(255,255,255,0.05)' : colors.n50;
  const border    = dark ? 'rgba(255,255,255,0.08)' : colors.n200;
  const selected  = CATEGORIAS.find(c => c.label === value);

  return (
    <>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: subColor }]}>CATEGORIA</Text>
        <TouchableOpacity
          style={[styles.fieldInput, styles.catSelector, { backgroundColor: inputBg, borderColor: border }]}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          {selected
            ? <>
                <Ionicons name={selected.icone as any} size={18} color={textColor} style={{ marginRight: 8 }} />
                <Text style={[styles.catSelectorText, { color: textColor }]}>{selected.label}</Text>
              </>
            : <Text style={[styles.catSelectorText, { color: subColor }]}>Selecione uma categoria</Text>}
          <Ionicons name="chevron-down" size={16} color={subColor} />
        </TouchableOpacity>
      </View>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setOpen(false)}>
        <View style={styles.catModal}>
          <View style={styles.catModalHeader}>
            <Text style={styles.catModalTitle}>Categoria da loja</Text>
            <TouchableOpacity onPress={() => setOpen(false)}>
              <Ionicons name="close" size={22} color={colors.navy} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={CATEGORIAS}
            keyExtractor={item => item.label}
            contentContainerStyle={{ paddingBottom: 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.catItem, item.label === value && styles.catItemSelected]}
                onPress={() => { onChange(item.label); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.icone as any}
                  size={20}
                  color={item.label === value ? colors.orange : colors.n600}
                  style={styles.catItemIcone}
                />
                <Text style={[styles.catItemLabel, item.label === value && { color: colors.orange, fontWeight: '700' }]}>
                  {item.label}
                </Text>
                {item.label === value && <Ionicons name="checkmark-circle" size={20} color={colors.orange} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

export function PerfilLoja({ dark = false }: PerfilLojaProps) {
  const token  = useAuthLojistaStore(s => s.token);
  const lojaId = useAuthLojistaStore(s => s.lojaId);
  const logout = useAuthLojistaStore(s => s.logout);

  const [loading,        setLoading]        = useState(true);
  const [saving,         setSaving]         = useState(false);
  const [uploading,      setUploading]      = useState<'logo' | 'banner' | null>(null);
  const [logoutVisible,  setLogoutVisible]  = useState(false);
  const [horarios,   setHorarios]   = useState<HorarioDia[]>(HORARIOS_INICIAIS);
  const [logoUri,    setLogoUri]    = useState<string | null>(null);
  const [bannerUri,  setBannerUri]  = useState<string | null>(null);
  const [loja, setLoja] = useState<LojaData>({
    nome: '', categoria: '', descricao: '', telefone: '',
    rua: '', numero: '', complemento: '', bairro: '', cep: '', cidade: '',
    aceitaAgendamento: false, antecedenciaMinima: '120',
  });

  useEffect(() => {
    if (!token || !lojaId) { setLoading(false); return; }
    LojistaService.buscarLojaDetalhes(lojaId, token).then(raw => {
      if (!raw) return;
      setLoja({
        nome:                raw.nome ?? '',
        categoria:           raw.categoria ?? '',
        descricao:           raw.descricao ?? '',
        telefone:            raw.telefone ?? '',
        rua:                 raw.endereco?.rua ?? '',
        numero:              raw.endereco?.numero ?? '',
        complemento:         raw.endereco?.complemento ?? '',
        bairro:              raw.endereco?.bairro ?? '',
        cep:                 raw.endereco?.cep ?? '',
        cidade:              raw.endereco?.cidade ?? '',
        aceitaAgendamento:   raw.aceitaAgendamento ?? false,
        antecedenciaMinima:  String(raw.antecedenciaMinima ?? 120),
      });
      if (raw.logoUrl)   setLogoUri(raw.logoUrl);
      if (raw.bannerUrl) setBannerUri(raw.bannerUrl);
      if (raw.horarios && raw.horarios.length > 0) {
        setHorarios(prev => prev.map((h, i) => {
          const bh = raw.horarios.find((x: any) => x.diaSemana === i);
          if (!bh) return h;
          return { ...h, ativo: bh.ativo, abertura: bh.abertura, fechamento: bh.fechamento };
        }));
      }
    }).finally(() => setLoading(false));
  }, [token, lojaId]);

  const textColor = dark ? colors.n0    : colors.navy;
  const subColor  = dark ? 'rgba(255,255,255,0.6)' : colors.n600;
  const bgMain    = dark ? '#0B0F22'    : colors.n50;
  const surface   = dark ? '#111638'    : colors.n0;
  const border    = dark ? 'rgba(255,255,255,0.06)' : colors.n200;

  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc]         = useState('');

  const updateLoja = useCallback((key: keyof LojaData, value: string | boolean) => {
    setLoja(prev => ({ ...prev, [key]: value }));
  }, []);

  const buscarCep = useCallback(async (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res  = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) { Alert.alert('CEP não encontrado'); return; }
      setLoja(prev => ({
        ...prev,
        rua:    data.logradouro || prev.rua,
        bairro: data.bairro     || prev.bairro,
        cidade: data.localidade  || prev.cidade,
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
        if (!navigator?.geolocation) { setErroLoc('Geolocalização não suportada.'); return; }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: false }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') { setErroLoc('Permita o acesso à localização.'); return; }
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        latitude = loc.coords.latitude;
        longitude = loc.coords.longitude;
      }
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'AjuLabsShopping/1.0' } },
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const cep  = (addr.postcode ?? '').replace(/\D/g, '').slice(0, 8);
      setLoja(prev => ({
        ...prev,
        rua:    addr.road || addr.pedestrian || prev.rua,
        bairro: addr.suburb || addr.neighbourhood || prev.bairro,
        cidade: addr.city || addr.town || prev.cidade,
        cep:    cep || prev.cep,
      }));
    } catch (e: any) {
      const msg = e?.code === 1 ? 'Permissão negada.' : e?.code === 3 ? 'Tempo esgotado.' : 'Não foi possível obter localização.';
      setErroLoc(msg);
    } finally {
      setBuscandoLoc(false);
    }
  };

  const updateHorario = useCallback((index: number, updated: HorarioDia) => {
    setHorarios(prev => prev.map((h, i) => i === index ? updated : h));
  }, []);

  const handleLogout = useCallback(() => {
    setLogoutVisible(true);
  }, []);

  const pickAndUpload = useCallback(async (tipo: 'logo' | 'banner') => {
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
    if (tipo === 'logo')   setLogoUri(uri);
    else                   setBannerUri(uri);

    setUploading(tipo);
    try {
      await LojistaService.atualizarImagemLoja(lojaId, token, tipo, uri);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Não foi possível fazer o upload. Tente novamente.';
      Alert.alert('Erro ao enviar imagem', msg);
      if (tipo === 'logo')   setLogoUri(null);
      else                   setBannerUri(null);
    } finally {
      setUploading(null);
    }
  }, [token, lojaId]);

  const handleSalvar = useCallback(async () => {
    if (!token || !lojaId) {
      Alert.alert('Erro', 'Sessão inválida.');
      return;
    }
    setSaving(true);
    try {
      await LojistaService.atualizarLoja(lojaId, token, {
        nome:                loja.nome,
        descricao:           loja.descricao,
        categoria:           loja.categoria,
        telefone:            loja.telefone,
        aceitaAgendamento:   loja.aceitaAgendamento,
        antecedenciaMinima:  parseInt(loja.antecedenciaMinima, 10) || 120,
        horarios: horarios.map((h, i) => ({
          diaSemana:  i,
          ativo:      h.ativo,
          abertura:   h.abertura,
          fechamento: h.fechamento,
        })),
        ...(loja.bairro || loja.cep || loja.cidade ? {
          endereco: {
            rua:         loja.rua,
            numero:      loja.numero,
            complemento: loja.complemento,
            bairro:      loja.bairro,
            cep:         loja.cep,
            cidade:      loja.cidade,
          },
        } : {}),
      });
      Alert.alert('Salvo!', 'As informações da loja foram atualizadas.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao salvar.';
      Alert.alert('Erro', msg);
    } finally {
      setSaving(false);
    }
  }, [token, lojaId, loja, horarios]);

  const hoje       = new Date();
  const diaSemana  = hoje.getDay();
  const mapDia     = [6, 0, 1, 2, 3, 4, 5];
  const horarioHoje = horarios[mapDia[diaSemana]];
  const agoraMin   = hoje.getHours() * 60 + hoje.getMinutes();
  const [aH, aM]   = (horarioHoje?.abertura || '00:00').split(':').map(Number);
  const [fH, fM]   = (horarioHoje?.fechamento || '00:00').split(':').map(Number);
  const abertaAgora = horarioHoje?.ativo
    && agoraMin >= aH * 60 + aM
    && agoraMin < fH * 60 + fM;

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgMain, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.orange} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgMain }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { backgroundColor: surface, borderBottomColor: border }]}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Perfil da loja</Text>
        <Text style={[styles.headerSub, { color: subColor }]}>Informações visíveis para os clientes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        <Text style={[styles.sectionLabel, { color: subColor }]}>IDENTIDADE VISUAL</Text>
        <View style={[styles.card, { borderColor: border }]}>
          {/* Banner */}
          <View style={[styles.banner, { backgroundColor: colors.navy }]}>
            {bannerUri
              ? <Image source={{ uri: bannerUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : null}
            <TouchableOpacity
              style={styles.bannerEditBtn}
              onPress={() => pickAndUpload('banner')}
              activeOpacity={0.8}
              disabled={uploading !== null}
            >
              {uploading === 'banner'
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="pencil" size={12} color="#fff" />}
            </TouchableOpacity>

            {/* Logo sobre o banner */}
            <View style={styles.avatarWrap}>
              <TouchableOpacity
                style={styles.avatarTouchable}
                onPress={() => pickAndUpload('logo')}
                activeOpacity={0.8}
                disabled={uploading !== null}
              >
                {logoUri
                  ? <Image source={{ uri: logoUri }} style={styles.logoImg} />
                  : <StoreAvatar nome={loja.nome || 'Loja'} size={58} />}
                <View style={styles.avatarEditBtn}>
                  {uploading === 'logo'
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Ionicons name="camera-outline" size={10} color="#fff" />}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, { color: textColor }]}>{loja.nome}</Text>
            <Text style={[styles.storeCat, { color: subColor }]}>{loja.categoria} · {loja.bairro}</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: abertaAgora ? '#046C2E' : colors.n600 }]} />
              <Text style={[styles.statusText, { color: abertaAgora ? '#046C2E' : colors.n600 }]}>
                {abertaAgora ? 'Aberta agora' : 'Fechada agora'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>INFORMAÇÕES DA LOJA</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.fieldGroup}>
            <FormField label="NOME DA LOJA" value={loja.nome} onChange={v => updateLoja('nome', v)} dark={dark} />
            <CategoriaPicker value={loja.categoria} onChange={v => updateLoja('categoria', v)} dark={dark} />
            <FormField label="DESCRIÇÃO" value={loja.descricao} onChange={v => updateLoja('descricao', v)} multiline dark={dark} />
            <FormField label="TELEFONE / WHATSAPP" value={loja.telefone} onChange={v => updateLoja('telefone', v)} keyboardType="phone-pad" dark={dark} />
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
              {buscandoLoc
                ? <ActivityIndicator size="small" color={colors.orange} />
                : <Ionicons name="navigate-outline" size={15} color={colors.orange} />}
              <Text style={styles.locBtnTxt}>
                {buscandoLoc ? 'Buscando...' : 'Usar minha localização'}
              </Text>
            </TouchableOpacity>
            {!!erroLoc && <Text style={styles.locErro}>{erroLoc}</Text>}

            {/* CEP com autofill */}
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: subColor }]}>CEP</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.fieldInput, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : colors.n50, borderColor: dark ? 'rgba(255,255,255,0.08)' : colors.n200, color: textColor, flex: 1 }]}
                    value={loja.cep}
                    onChangeText={v => {
                      const d = v.replace(/\D/g, '').slice(0, 8);
                      updateLoja('cep', d);
                      if (d.length === 8) buscarCep(d);
                    }}
                    placeholder="00000000"
                    placeholderTextColor={subColor}
                    keyboardType="numeric"
                    maxLength={8}
                  />
                  {buscandoCep && <ActivityIndicator size="small" color={colors.orange} style={{ marginLeft: 8 }} />}
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="BAIRRO" value={loja.bairro} onChange={v => updateLoja('bairro', v)} dark={dark} />
              </View>
            </View>

            <View style={styles.fieldRow}>
              <View style={{ flex: 2 }}>
                <FormField label="RUA" value={loja.rua} onChange={v => updateLoja('rua', v)} placeholder="Nome da rua" dark={dark} />
              </View>
              <View style={{ flex: 1 }}>
                <FormField label="NÚMERO" value={loja.numero} onChange={v => updateLoja('numero', v)} placeholder="Nº" keyboardType="numeric" dark={dark} />
              </View>
            </View>
            <FormField label="COMPLEMENTO" value={loja.complemento} onChange={v => updateLoja('complemento', v)} placeholder="Nº da loja, Box, Sala, Apto..." dark={dark} />
            <FormField label="CIDADE" value={loja.cidade} onChange={v => updateLoja('cidade', v)} dark={dark} />
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>HORÁRIO DE FUNCIONAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          {horarios.map((horario, index) => (
            <View
              key={horario.dia}
              style={index < horarios.length - 1 && { borderBottomWidth: 1, borderBottomColor: border }}
            >
              <HorarioRow
                horario={horario}
                onChange={updated => updateHorario(index, updated)}
                dark={dark}
              />
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: subColor }]}>AGENDAMENTO</Text>
        <View style={[styles.card, { borderColor: border, backgroundColor: surface }]}>
          <View style={styles.agendRow}>
            <View style={styles.agendInfo}>
              <Text style={[styles.agendTitle, { color: textColor }]}>Aceitar pedidos agendados</Text>
              <Text style={[styles.agendSub, { color: subColor }]}>Cliente escolhe data e hora fora do horário</Text>
            </View>
            <Switch
              value={loja.aceitaAgendamento}
              onValueChange={v => updateLoja('aceitaAgendamento', v)}
              trackColor={{ false: colors.n200, true: '#046C2E' }}
              thumbColor="#fff"
            />
          </View>
          {loja.aceitaAgendamento && (
            <View style={[styles.agendRow, { borderTopWidth: 1, borderTopColor: border }]}>
              <View style={styles.agendInfo}>
                <Text style={[styles.agendTitle, { color: textColor }]}>Antecedência mínima (minutos)</Text>
                <Text style={[styles.agendSub, { color: subColor }]}>Ex: 60 = 1 hora, 120 = 2 horas</Text>
              </View>
              <TextInput
                style={[styles.antecedenciaInput, { borderColor: border, color: textColor, backgroundColor: colors.n50 }]}
                value={loja.antecedenciaMinima}
                onChangeText={v => updateLoja('antecedenciaMinima', v)}
                keyboardType="numeric"
                placeholder="120"
              />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSalvar}
          activeOpacity={0.85}
          disabled={saving}
        >
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.saveBtnText}>Salvar alterações</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={18} color="#E24B4A" />
          <Text style={styles.logoutBtnText}>Sair da conta</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>

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
              Tem certeza que deseja sair? Você precisará fazer login novamente para acessar sua conta.
            </Text>
            <TouchableOpacity
              style={styles.modalBtnSair}
              onPress={() => { setLogoutVisible(false); logout(); }}
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
  container:        { flex: 1 },
  header:           { padding: 16, paddingBottom: 12, borderBottomWidth: 1 },
  headerTitle:      { fontWeight: '700', fontSize: 18, letterSpacing: -0.3 },
  headerSub:        { fontSize: 12, marginTop: 2 },
  content:          { padding: 14, gap: 8 },
  sectionLabel:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.5,
                      marginTop: 6, marginBottom: 4, paddingHorizontal: 2 },
  card:             { borderRadius: 16, borderWidth: 1, overflow: 'hidden',
                      backgroundColor: '#fff' },
  banner:           { height: 90, position: 'relative' },
  bannerEditBtn:    { position: 'absolute', top: 8, right: 8, width: 28, height: 28,
                      borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.4)',
                      alignItems: 'center', justifyContent: 'center' },
  avatarWrap:       { position: 'absolute', bottom: -22, left: 14 },
  avatarTouchable:  { position: 'relative' },
  avatar:           { backgroundColor: colors.orange, alignItems: 'center',
                      justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  avatarText:       { color: '#fff', fontWeight: '700' },
  logoImg:          { width: 58, height: 58, borderRadius: 14, borderWidth: 3, borderColor: '#fff' },
  avatarEditBtn:    { position: 'absolute', bottom: -2, right: -2,
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: colors.orange, alignItems: 'center',
                      justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  storeInfo:        { paddingTop: 28, padding: 14 },
  storeName:        { fontSize: 16, fontWeight: '700' },
  storeCat:         { fontSize: 12, marginTop: 2 },
  statusRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  statusDot:        { width: 8, height: 8, borderRadius: 4 },
  statusText:       { fontSize: 12, fontWeight: '600' },
  fieldGroup:       { padding: 14, gap: 12 },
  fieldRow:         { flexDirection: 'row', gap: 10 },
  locBtn:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
                      paddingVertical: 11, borderRadius: 10, borderWidth: 1.5,
                      borderColor: colors.orange, backgroundColor: colors.orange100 },
  locBtnTxt:        { fontSize: 13, fontWeight: '600', color: colors.orange },
  locErro:          { fontSize: 11, color: '#E24B4A', fontWeight: '500' },
  field:            { gap: 5 },
  fieldLabel:       { fontSize: 11, fontWeight: '700',
                      textTransform: 'uppercase', letterSpacing: 0.4 },
  fieldInput:       { borderRadius: 10, borderWidth: 1,
                      paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  // HorarioRow — layout em 2 linhas para melhor responsividade mobile
  dayRow:           { paddingHorizontal: 14, paddingVertical: 10 },
  dayTopRow:        { flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: 8 },
  dayName:          { fontSize: 13, fontWeight: '600' },
  dayTimeRow:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeRangeLabel:   { fontSize: 11, fontWeight: '500', minWidth: 56 },
  timeInput:        { flex: 1, borderRadius: 8, borderWidth: 1,
                      paddingVertical: 8, paddingHorizontal: 10,
                      fontSize: 13, fontWeight: '600', textAlign: 'center',
                      minWidth: 64 },
  timeSep:          { fontSize: 14, fontWeight: '600', marginHorizontal: 2 },
  agendRow:         { flexDirection: 'row', alignItems: 'center',
                      justifyContent: 'space-between', padding: 14, gap: 12 },
  agendInfo:        { flex: 1 },
  agendTitle:       { fontSize: 14, fontWeight: '600' },
  agendSub:         { fontSize: 11, marginTop: 2 },
  antecedenciaInput:{ width: 80, borderRadius: 8, borderWidth: 1,
                      paddingVertical: 6, paddingHorizontal: 8,
                      fontSize: 13, fontWeight: '600', textAlign: 'center' },
  saveBtn:          { height: 50, borderRadius: 14, backgroundColor: colors.orange,
                      alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  saveBtnText:      { fontSize: 15, fontWeight: '700', color: '#fff' },
  logoutBtn:        { height: 50, borderRadius: 14, borderWidth: 1, borderColor: '#E24B4A',
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, marginTop: 10 },
  logoutBtnText:    { fontSize: 15, fontWeight: '700', color: '#E24B4A' },

  // Modal de logout
  modalOverlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalBox:         { width: '100%', maxWidth: 340, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center' },
  modalIconWrap:    { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(226,75,74,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle:       { fontSize: 18, fontWeight: '800', color: '#000933', marginBottom: 8 },
  modalMsg:         { fontSize: 14, color: '#5A6480', textAlign: 'center', lineHeight: 21, marginBottom: 24 },
  modalBtnSair:     { width: '100%', paddingVertical: 15, borderRadius: 14, backgroundColor: '#E24B4A', alignItems: 'center', marginBottom: 10 },
  modalBtnSairText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  modalBtnCancel:   { width: '100%', paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: '#E4E7F1', alignItems: 'center' },
  modalBtnCancelText: { fontSize: 15, fontWeight: '600', color: '#5A6480' },

  // CategoriaPicker
  catSelector:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      height: 46, paddingHorizontal: 12 },
  catSelectorText:  { fontSize: 14, flex: 1 },
  catModal:         { flex: 1, backgroundColor: '#fff' },
  catModalHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 20, paddingVertical: 16,
                      borderBottomWidth: 1, borderBottomColor: colors.n200 },
  catModalTitle:    { fontSize: 17, fontWeight: '700', color: colors.navy },
  catItem:          { flexDirection: 'row', alignItems: 'center', gap: 14,
                      paddingHorizontal: 20, paddingVertical: 15,
                      borderBottomWidth: 1, borderBottomColor: colors.n100 },
  catItemSelected:  { backgroundColor: 'rgba(242,118,15,0.07)' },
  catItemIcone:     { width: 28, textAlign: 'center' },
  catItemLabel:     { flex: 1, fontSize: 15, color: colors.navy },
});
