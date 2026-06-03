import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  useCartStore,
  calcularGrupos,
  calcularQuantidadeItens,
  useAuthStore,
} from '../../../../store';
import { useTheme } from '../../../../hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@ajulabs/theme';
import { EnderecoSalvo } from '@ajulabs/types';
import { EnderecoService, LojaService } from '@ajulabs/api-client';
import { CartLojaGrupo } from './CartLojaGrupo';

interface EnderecoForm {
  apelido: string;
  rua: string;
  numero: string;
  bairro: string;
  cep: string;
  cidade: string;
  complemento: string;
}
const FORM_VAZIO: EnderecoForm = {
  apelido: '',
  rua: '',
  numero: '',
  bairro: '',
  cep: '',
  cidade: 'Aracaju',
  complemento: '',
};

function formatCEP(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDark, bg, surf, border, borderL, text, textSec, backBtn, iconBg, inputBg } = useTheme();

  const itensPorLoja = useCartStore((s) => s.itensPorLoja);
  const lojasCache = useCartStore((s) => s.lojasCache);
  const cachearLoja = useCartStore((s) => s.cachearLoja);
  const aumentar = useCartStore((s) => s.aumentar);
  const diminuir = useCartStore((s) => s.diminuir);
  const token = useAuthStore((s) => s.token);

  const [enderecos, setEnderecos] = useState<EnderecoSalvo[]>([]);
  const [enderecoId, setEnderecoId] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Modal novo endereço
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<EnderecoForm>(FORM_VAZIO);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState('');
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoLoc, setBuscandoLoc] = useState(false);
  const [erroLoc, setErroLoc] = useState('');

  const carregarEnderecos = useCallback(() => {
    if (!token) return;
    EnderecoService.listar(token)
      .then((data) => {
        setEnderecos(data);
        if (!enderecoId) {
          const padrao = data.find((e) => e.padrao) ?? data[0];
          if (padrao) setEnderecoId(padrao.id);
        }
      })
      .catch(() => {});
  }, [token, enderecoId]);

  useEffect(() => {
    carregarEnderecos();
  }, [token]);

  // Rehidrata lojasCache para lojaIds que sobreviveram no AsyncStorage mas perderam o cache.
  // Depende de itensPorLoja para reagir quando a hidratação do Zustand/AsyncStorage completa.
  useEffect(() => {
    const ausentes = Object.keys(itensPorLoja).filter((id) => !lojasCache[id]);
    if (ausentes.length === 0) return;
    ausentes.forEach((id) => {
      LojaService.buscarPorId(id)
        .then((loja) => {
          if (loja) cachearLoja(loja);
        })
        .catch(() => {});
    });
  }, [itensPorLoja]);

  const enderecoAtual = enderecos.find((e) => e.id === enderecoId);

  const grupos = useMemo(
    () => calcularGrupos(itensPorLoja, lojasCache),
    [itensPorLoja, lojasCache],
  );
  const quantidadeItens = useMemo(() => calcularQuantidadeItens(itensPorLoja), [itensPorLoja]);
  const subtotalGeral = useMemo(() => grupos.reduce((acc, g) => acc + g.subtotal, 0), [grupos]);
  const freteTotal = useMemo(() => grupos.reduce((acc, g) => acc + g.taxaEntrega, 0), [grupos]);
  const total = subtotalGeral + freteTotal;
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;
  const numLojas = grupos.length;

  // ── helpers do formulário ──────────────────────────────────────
  const clearError = (field: string) => setErrors((e) => ({ ...e, [field]: '' }));

  const buscarCep = useCallback(async (digits: string) => {
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    clearError('cep');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setErrors((e) => ({ ...e, cep: 'CEP não encontrado.' }));
        return;
      }
      setForm((f) => ({
        ...f,
        rua: data.logradouro || f.rua,
        bairro: data.bairro || f.bairro,
        cidade: data.localidade || f.cidade,
      }));
    } catch {
      setErrors((e) => ({ ...e, cep: 'Erro ao buscar CEP.' }));
    } finally {
      setBuscandoCep(false);
    }
  }, []);

  const usarLocalizacao = async () => {
    setBuscandoLoc(true);
    setErroLoc('');
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          setErroLoc('Geolocalização não suportada.');
          return;
        }
        const pos = await new Promise<GeolocationPosition>((res, rej) =>
          navigator.geolocation.getCurrentPosition(res, rej, { timeout: 10000 }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErroLoc('Permita o acesso à localização.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'AjuLabsShopping/1.0' } },
      );
      const data = await res.json();
      const addr = data.address ?? {};
      const cepRaw = (addr.postcode ?? '').replace(/\D/g, '').slice(0, 8);
      setForm((f) => ({
        ...f,
        rua: addr.road || addr.pedestrian || addr.street || f.rua,
        bairro: addr.suburb || addr.neighbourhood || addr.city_district || f.bairro,
        cidade: addr.city || addr.town || addr.village || f.cidade,
        cep: cepRaw || f.cep,
      }));
      setErrors({});
    } catch (e: any) {
      setErroLoc(e?.code === 1 ? 'Localização negada.' : 'Não foi possível obter localização.');
    } finally {
      setBuscandoLoc(false);
    }
  };

  const fecharForm = () => {
    setShowForm(false);
    setForm(FORM_VAZIO);
    setErrors({});
    setErroGeral('');
    setErroLoc('');
  };

  const handleSalvar = async () => {
    setErroGeral('');
    if (!token) return;
    const newErrors: Record<string, string> = {};
    if (!form.apelido.trim()) newErrors.apelido = 'Campo obrigatório.';
    if (!form.rua.trim()) newErrors.rua = 'Campo obrigatório.';
    if (!form.numero.trim()) newErrors.numero = 'Campo obrigatório.';
    if (!form.bairro.trim()) newErrors.bairro = 'Campo obrigatório.';
    if (!form.cidade.trim()) newErrors.cidade = 'Campo obrigatório.';
    if (form.cep.replace(/\D/g, '').length !== 8) newErrors.cep = 'CEP inválido.';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const novo = await EnderecoService.criar(token, {
        ...form,
        cep: form.cep.replace(/\D/g, ''),
        complemento: form.complemento || undefined,
      });
      fecharForm();
      setShowPicker(true);
      await carregarEnderecos();
      setEnderecoId(novo.id);
    } catch (e: any) {
      setErroGeral(e?.message ?? 'Não foi possível salvar o endereço.');
    } finally {
      setSaving(false);
    }
  };

  // ── tela vazia ────────────────────────────────────────────────
  if (grupos.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bg }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.push('/(consumer)/vitrines')}
            style={[styles.btnBack, { backgroundColor: backBtn }]}
          >
            <Ionicons name="chevron-back" size={20} color={text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.titulo, { color: text }]}>Carrinho</Text>
            <Text style={[styles.subtitulo, { color: textSec as string }]}>Vazio</Text>
          </View>
        </View>
        <View style={styles.vazio}>
          <Ionicons
            name="cart-outline"
            size={56}
            color={isDark ? 'rgba(255,255,255,0.2)' : colors.n300}
          />
          <Text style={[styles.vazioTitulo, { color: text }]}>Seu carrinho está vazio</Text>
          <Text style={[styles.vazioTxt, { color: textSec as string }]}>
            Explore as vitrines e adicione produtos
          </Text>
          <TouchableOpacity
            style={styles.vazioBtn}
            onPress={() => router.push('/(consumer)/vitrines')}
            activeOpacity={0.85}
          >
            <Text style={styles.vazioBtnTxt}>Ver vitrines</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: surf, borderBottomColor: borderL, paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.push('/(consumer)/vitrines')}
          style={[styles.btnBack, { backgroundColor: backBtn }]}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={20} color={text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.titulo, { color: text }]}>Carrinho</Text>
          <Text style={[styles.subtitulo, { color: textSec as string }]}>
            {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'} · {numLojas}{' '}
            {numLojas === 1 ? 'loja' : 'lojas'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Endereço */}
        <View style={[styles.endCard, { backgroundColor: surf, borderColor: border }]}>
          <TouchableOpacity
            style={styles.endRow}
            onPress={() => setShowPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.endIconBox, { backgroundColor: iconBg }]}>
              <Ionicons name="location" size={16} color={colors.orange} />
            </View>
            <View style={{ flex: 1 }}>
              {enderecoAtual ? (
                <>
                  <Text style={[styles.endApelido, { color: text }]}>{enderecoAtual.apelido}</Text>
                  <Text style={[styles.endRua, { color: textSec as string }]} numberOfLines={1}>
                    {enderecoAtual.rua}
                  </Text>
                </>
              ) : (
                <Text style={[styles.endVazio, { color: textSec as string }]}>
                  {enderecos.length === 0
                    ? 'Adicione um endereço de entrega'
                    : 'Selecione o endereço'}
                </Text>
              )}
            </View>
            <Ionicons
              name={showPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={textSec as string}
            />
          </TouchableOpacity>

          {showPicker && (
            <View style={[styles.endLista, { borderTopColor: borderL }]}>
              {enderecos.map((addr) => (
                <TouchableOpacity
                  key={addr.id}
                  style={styles.endOpcao}
                  onPress={() => {
                    setEnderecoId(addr.id);
                    setShowPicker(false);
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={addr.id === enderecoId ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={colors.orange}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.endOpcaoApelido, { color: text }]}>
                      {addr.apelido}
                      {addr.padrao ? '  ·  Padrão' : ''}
                    </Text>
                    <Text
                      style={[styles.endOpcaoRua, { color: textSec as string }]}
                      numberOfLines={1}
                    >
                      {addr.rua}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Botão adicionar novo endereço */}
              <TouchableOpacity
                style={[
                  styles.endOpcaoAdd,
                  { borderTopColor: borderL, borderTopWidth: enderecos.length > 0 ? 1 : 0 },
                ]}
                onPress={() => {
                  setShowPicker(false);
                  setShowForm(true);
                }}
                activeOpacity={0.75}
              >
                <Ionicons name="add-circle-outline" size={17} color={colors.orange} />
                <Text style={styles.endOpcaoAddTxt}>Adicionar novo endereço</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {numLojas > 1 && (
          <View style={[styles.banner, isDark && { backgroundColor: 'rgba(242,118,15,0.12)' }]}>
            <View style={styles.bannerTitleRow}>
              <Ionicons name="storefront-outline" size={13} color={colors.orange600} />
              <Text style={[styles.bannerTxt, { fontWeight: '700' }]}>
                Compra em {numLojas} lojas
              </Text>
            </View>
            <Text style={styles.bannerTxt}>
              Cada loja tem seu frete e motoboy próprio, mas você paga tudo de uma vez.
            </Text>
          </View>
        )}

        {grupos.map((grupo, idx) => (
          <CartLojaGrupo
            key={grupo.lojaId}
            numero={idx + 1}
            grupo={grupo}
            onAumentar={aumentar}
            onDiminuir={diminuir}
          />
        ))}

        <View style={[styles.totalCard, { backgroundColor: surf, borderColor: border }]}>
          <View style={styles.linhaTotal}>
            <Text style={[styles.linhaLabel, { color: textSec as string }]}>Subtotal</Text>
            <Text style={[styles.linhaValue, { color: text }]}>{fmt(subtotalGeral)}</Text>
          </View>
          <View style={styles.linhaTotal}>
            <Text style={[styles.linhaLabel, { color: textSec as string }]}>
              Frete{numLojas > 1 ? ` (${numLojas} lojas)` : ''}
            </Text>
            <Text style={[styles.linhaValue, { color: text }]}>
              {freteTotal === 0 ? 'Grátis' : fmt(freteTotal)}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: borderL }]} />
          <View style={styles.linhaTotal}>
            <Text style={[styles.totalLabel, { color: text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: text }]}>{fmt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: surf, borderTopColor: borderL }]}>
        <TouchableOpacity
          style={styles.btnFinalizar}
          onPress={() => router.push('/(consumer)/checkout')}
          activeOpacity={0.9}
        >
          <Text style={styles.btnFinalizarTxt}>Finalizar pedido</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.n0} />
        </TouchableOpacity>
      </View>

      {/* ── Modal: Novo endereço ──────────────────────────────── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modal, { backgroundColor: bg }]}>
            <View
              style={[styles.modalHeader, { backgroundColor: surf, borderBottomColor: borderL }]}
            >
              <Text style={[styles.modalTitulo, { color: text }]}>Novo Endereço</Text>
              <TouchableOpacity onPress={fecharForm}>
                <Ionicons name="close" size={24} color={text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Usar localização */}
              <TouchableOpacity
                style={[styles.locBtn, buscandoLoc && { opacity: 0.6 }]}
                onPress={usarLocalizacao}
                disabled={buscandoLoc}
                activeOpacity={0.8}
              >
                {buscandoLoc ? (
                  <ActivityIndicator size="small" color={colors.orange} />
                ) : (
                  <Ionicons name="navigate-outline" size={16} color={colors.orange} />
                )}
                <Text style={styles.locBtnTxt}>
                  {buscandoLoc ? 'Buscando localização...' : 'Usar minha localização'}
                </Text>
              </TouchableOpacity>
              {!!erroLoc && (
                <View
                  style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}
                >
                  <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                  <Text style={styles.erroTxt}>{erroLoc}</Text>
                </View>
              )}

              {/* Apelido */}
              <Text style={[styles.label, { color: textSec as string }]}>Apelido *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.apelido ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.apelido}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, apelido: v }));
                  clearError('apelido');
                }}
                placeholder="Ex: Casa, Trabalho"
                placeholderTextColor={textSec as string}
              />
              {!!errors.apelido && <Text style={styles.fieldError}>{errors.apelido}</Text>}

              {/* CEP */}
              <Text style={[styles.label, { color: textSec as string }]}>CEP *</Text>
              <View style={styles.cepRow}>
                <TextInput
                  style={[
                    styles.input,
                    styles.cepInput,
                    {
                      backgroundColor: inputBg,
                      borderColor: errors.cep ? '#E24B4A' : border,
                      color: text,
                    },
                  ]}
                  value={formatCEP(form.cep)}
                  onChangeText={(v) => {
                    const d = v.replace(/\D/g, '').slice(0, 8);
                    setForm((f) => ({ ...f, cep: d }));
                    clearError('cep');
                    if (d.length === 8) buscarCep(d);
                  }}
                  placeholder="00000-000"
                  placeholderTextColor={textSec as string}
                  keyboardType="numeric"
                  maxLength={9}
                />
                {buscandoCep && (
                  <ActivityIndicator
                    size="small"
                    color={colors.orange}
                    style={{ marginLeft: 10 }}
                  />
                )}
              </View>
              {!!errors.cep && <Text style={styles.fieldError}>{errors.cep}</Text>}

              {/* Rua */}
              <Text style={[styles.label, { color: textSec as string }]}>Rua / Avenida *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.rua ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.rua}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, rua: v }));
                  clearError('rua');
                }}
                placeholder="Ex: Av. Ivo do Prado"
                placeholderTextColor={textSec as string}
              />
              {!!errors.rua && <Text style={styles.fieldError}>{errors.rua}</Text>}

              {/* Número + Complemento */}
              <View style={{ flexDirection: 'row' }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: textSec as string }]}>Número *</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: inputBg,
                        borderColor: errors.numero ? '#E24B4A' : border,
                        color: text,
                      },
                    ]}
                    value={form.numero}
                    onChangeText={(v) => {
                      setForm((f) => ({ ...f, numero: v }));
                      clearError('numero');
                    }}
                    placeholder="123"
                    placeholderTextColor={textSec as string}
                    keyboardType="numeric"
                  />
                  {!!errors.numero && <Text style={styles.fieldError}>{errors.numero}</Text>}
                </View>
                <View style={{ flex: 2, marginLeft: 12 }}>
                  <Text style={[styles.label, { color: textSec as string }]}>Complemento</Text>
                  <TextInput
                    style={[
                      styles.input,
                      { backgroundColor: inputBg, borderColor: border, color: text },
                    ]}
                    value={form.complemento}
                    onChangeText={(v) => setForm((f) => ({ ...f, complemento: v }))}
                    placeholder="Apto, Bloco..."
                    placeholderTextColor={textSec as string}
                  />
                </View>
              </View>

              {/* Bairro */}
              <Text style={[styles.label, { color: textSec as string }]}>Bairro *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.bairro ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.bairro}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, bairro: v }));
                  clearError('bairro');
                }}
                placeholder="Ex: Centro"
                placeholderTextColor={textSec as string}
              />
              {!!errors.bairro && <Text style={styles.fieldError}>{errors.bairro}</Text>}

              {/* Cidade */}
              <Text style={[styles.label, { color: textSec as string }]}>Cidade *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: inputBg,
                    borderColor: errors.cidade ? '#E24B4A' : border,
                    color: text,
                  },
                ]}
                value={form.cidade}
                onChangeText={(v) => {
                  setForm((f) => ({ ...f, cidade: v }));
                  clearError('cidade');
                }}
                placeholder="Aracaju"
                placeholderTextColor={textSec as string}
              />
              {!!errors.cidade && <Text style={styles.fieldError}>{errors.cidade}</Text>}

              {!!erroGeral && (
                <View
                  style={[styles.erroBox, isDark && { backgroundColor: 'rgba(163,45,45,0.18)' }]}
                >
                  <Ionicons name="alert-circle-outline" size={15} color="#A32D2D" />
                  <Text style={styles.erroTxt}>{erroGeral}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSalvar}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.n0} />
                ) : (
                  <Text style={styles.saveBtnTxt}>Salvar endereço</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  btnBack: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  subtitulo: { fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, paddingBottom: 24 },
  banner: {
    backgroundColor: colors.orange100,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 2,
  },
  bannerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  bannerTxt: { fontSize: 12.5, color: colors.orange600, lineHeight: 17 },
  totalCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4 },
  linhaTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linhaLabel: { fontSize: 13 },
  linhaValue: { fontSize: 13, fontWeight: '500' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: '700' },
  totalValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  endCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  endIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endApelido: { fontSize: 13, fontWeight: '700' },
  endRua: { fontSize: 12, marginTop: 1 },
  endVazio: { fontSize: 13 },
  endLista: { borderTopWidth: 1, paddingHorizontal: 14, paddingBottom: 6 },
  endOpcao: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  endOpcaoApelido: { fontSize: 13, fontWeight: '600' },
  endOpcaoRua: { fontSize: 12, marginTop: 1 },
  endOpcaoAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    marginTop: 2,
  },
  endOpcaoAddTxt: { fontSize: 13, color: colors.orange, fontWeight: '600' },
  footer: { padding: 16, paddingBottom: 24, borderTopWidth: 1 },
  btnFinalizar: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  btnFinalizarTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
  vazio: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  vazioTitulo: { fontSize: 18, fontWeight: '700', marginTop: 12 },
  vazioTxt: { fontSize: 13, textAlign: 'center' },
  vazioBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.orange,
    borderRadius: 12,
  },
  vazioBtnTxt: { color: colors.n0, fontSize: 14, fontWeight: '700' },

  // Modal
  modal: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitulo: { fontSize: 18, fontWeight: '700' },
  modalScroll: { padding: 20 },
  locBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.orange,
    backgroundColor: colors.orange100,
    marginBottom: 8,
  },
  locBtnTxt: { fontSize: 13, fontWeight: '600', color: colors.orange },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 14 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  cepRow: { flexDirection: 'row', alignItems: 'center' },
  cepInput: { flex: 1 },
  erroBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    padding: 12,
    backgroundColor: '#FCEBEB',
    borderRadius: 10,
  },
  erroTxt: { flex: 1, fontSize: 13, color: '#A32D2D' },
  saveBtn: {
    backgroundColor: colors.orange,
    height: 52,
    borderRadius: 14,
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 4,
  },
  saveBtnTxt: { color: colors.n0, fontSize: 15, fontWeight: '700' },
});
