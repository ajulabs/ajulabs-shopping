import { useState, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  findNodeHandle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, AjuLogo } from '../../../../theme';
import { useAuthLojistaStore } from '../model/store';
import { validateCNPJ } from '../lib/validateCNPJ';
import { Field } from './components/Field';
import { PhoneInput } from './components/PhoneInput';
import { LocationPickerMap } from '../../../../components/LocationPickerMap';
import { enrichRateLimit } from '../../../../utils/enrichRateLimit';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

interface CadastroLojistaProps {
  onCadastroSuccess?: () => void;
}

interface FormData {
  cnpj: string;
  nomeLoja: string;
  telefone: string;
  telefoneCompleto: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

interface EnderecoLoja {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
}

export function CadastroLojista({ onCadastroSuccess }: CadastroLojistaProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const registrar = useAuthLojistaStore((s) => s.registrar);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [form, setForm] = useState<FormData>({
    cnpj: '',
    nomeLoja: '',
    telefone: '',
    telefoneCompleto: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });
  const [endereco, setEndereco] = useState<EnderecoLoja>({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
  });
  const [locLoading, setLocLoading] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Record<string, View | null>>({});

  const setEnderecoField = useCallback((key: keyof EnderecoLoja, value: string) => {
    setEndereco((prev) => ({ ...prev, [key]: value }));
  }, []);

  const clearError = useCallback(
    (...keys: string[]) =>
      setErrors((prev) => {
        if (keys.every((k) => !prev[k])) return prev;
        const next = { ...prev };
        keys.forEach((k) => delete next[k]);
        return next;
      }),
    [],
  );

  const scrollToField = useCallback((key: string) => {
    const ref = fieldRefs.current[key];
    if (!ref) return;
    if (Platform.OS === 'web') {
      (ref as any).scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      return;
    }
    try {
      const node = findNodeHandle(scrollRef.current);
      if (node && typeof ref.measureLayout === 'function') {
        ref.measureLayout(
          node,
          (_x, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true }),
          () => {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
          },
        );
      }
    } catch {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const usarLocalizacao = useCallback(async () => {
    setLocLoading(true);
    clearError('localizacao');
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 60000,
            }),
          );
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        } catch (geoErr: any) {
          const msg =
            geoErr?.code === 1
              ? 'Permissão de localização negada. Permita o acesso no navegador e tente novamente.'
              : 'Não foi possível obter sua localização. Verifique se o GPS está ativo.';
          setErrors((e) => ({ ...e, localizacao: msg }));
          return;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrors((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }

      // GPS obtido — exibe mapa mesmo que o geocode falhe
      setPinCoords({ lat, lng });

      try {
        const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setEndereco({
          cep: (data.cep ?? '').replace(/\D/g, ''),
          rua: data.rua ?? '',
          numero: '',
          bairro: data.bairro ?? '',
        });
        clearError('cep', 'rua', 'bairro');
      } catch {
        // Geocode falhou mas coordenadas estão disponíveis — usuário pode preencher manualmente
      }
    } finally {
      setLocLoading(false);
    }
  }, [clearError]);

  const handlePinMoved = useCallback(
    async (lat: number, lng: number) => {
      setPinCoords({ lat, lng });
      try {
        const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
        if (!res.ok) return;
        const data = await res.json();
        setEndereco((prev) => ({
          ...prev,
          cep: (data.cep ?? prev.cep).replace(/\D/g, ''),
          rua: data.rua || prev.rua,
          bairro: data.bairro || prev.bairro,
        }));
        clearError('cep', 'rua', 'bairro');
      } catch {}
    },
    [clearError],
  );

  const setField = useCallback(
    (key: keyof FormData, value: string) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearError(key);
    },
    [clearError],
  );

  const checkDisponivel = useCallback(
    async (field: 'cnpj' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/lojista/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cnpj: 'Este CNPJ já possui uma conta. Faça login ou use outro CNPJ.',
            email: 'Este e-mail já está em uso. Faça login ou use outro e-mail.',
            telefone: 'Este telefone já está cadastrado. Faça login ou use outro número.',
          };
          setErrors((prev) => ({ ...prev, [field]: msgs[field] }));
        }
      } catch {
        // falha silenciosa — o submit valida novamente no servidor
      }
    },
    [],
  );

  const blurCnpj = useCallback(async () => {
    const digits = form.cnpj.replace(/\D/g, '');
    if (!digits) return;
    if (digits.length < 14) {
      setErrors((e) => ({ ...e, cnpj: 'CNPJ incompleto — informe os 14 dígitos.' }));
    } else if (!validateCNPJ(form.cnpj)) {
      setErrors((e) => ({ ...e, cnpj: 'CNPJ inválido. Verifique os números digitados.' }));
    } else {
      await checkDisponivel('cnpj', digits);
    }
  }, [form.cnpj, checkDisponivel]);

  const blurEmail = useCallback(async () => {
    const trimmed = form.email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setErrors((e) => ({ ...e, email: 'Email inválido.' }));
    } else {
      await checkDisponivel('email', trimmed);
    }
  }, [form.email, checkDisponivel]);

  const blurTelefone = useCallback(async () => {
    const digits = form.telefoneCompleto.replace(/\D/g, '');
    if (digits.length < 10) return;
    await checkDisponivel('telefone', form.telefoneCompleto.replace(/[^\d+]/g, ''));
  }, [form.telefoneCompleto, checkDisponivel]);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    const cnpjDigits = form.cnpj.replace(/\D/g, '');
    if (cnpjDigits.length < 14) errs.cnpj = 'CNPJ incompleto — informe os 14 dígitos.';
    else if (!validateCNPJ(form.cnpj)) errs.cnpj = 'CNPJ inválido. Verifique os números digitados.';
    if (!form.nomeLoja.trim()) errs.nomeLoja = 'Informe o nome da loja.';
    if (form.telefoneCompleto.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Email inválido.';
    if (form.senha.length < 8) errs.senha = 'Mínimo 8 caracteres.';
    else if (!/[A-Z]/.test(form.senha)) errs.senha = 'Inclua ao menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(form.senha)) errs.senha = 'Inclua ao menos 1 número.';
    if (!form.confirmarSenha) errs.confirmarSenha = 'Confirme sua senha.';
    else if (form.senha !== form.confirmarSenha) errs.confirmarSenha = 'As senhas não coincidem.';
    if (!endereco.cep) errs.cep = 'Informe o CEP da loja.';
    else if (endereco.cep.length < 8) errs.cep = 'CEP incompleto — informe os 8 dígitos.';
    if (!endereco.rua.trim()) errs.rua = 'Informe a rua ou avenida da loja.';
    if (!endereco.bairro.trim()) errs.bairro = 'Informe o bairro da loja.';
    if (!aceitouTermos) errs.termos = 'Aceite os Termos de Uso para continuar.';
    setErrors(errs);
    return errs;
  }, [form, endereco, aceitouTermos]);

  const handleCadastro = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      const order = [
        'cnpj',
        'nomeLoja',
        'telefone',
        'email',
        'senha',
        'confirmarSenha',
        'cep',
        'bairro',
        'rua',
        'termos',
      ];
      const firstKey = order.find((k) => errs[k]);
      if (firstKey) scrollToField(firstKey);
      return;
    }
    setLoading(true);
    try {
      await registrar({
        cnpj: form.cnpj,
        nomeResponsavel: form.nomeLoja,
        telefone: form.telefoneCompleto,
        email: form.email,
        senha: form.senha,
      });

      if (endereco.rua.trim() && endereco.cep.trim()) {
        const { lojaId, token } = useAuthLojistaStore.getState();
        if (lojaId && token) {
          await fetch(`${LAPI}/lojista/lojas/${lojaId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              endereco: {
                rua: endereco.rua,
                numero: endereco.numero || 's/n',
                bairro: endereco.bairro,
                cep: endereco.cep.replace(/\D/g, ''),
                cidade: 'Aracaju',
                ...(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng } : {}),
              },
            }),
          }).catch(() => {});
        }
      }

      onCadastroSuccess?.();
      router.replace('/(lojista)/onboarding');
    } catch (e) {
      const isNetwork =
        e instanceof Error &&
        (e.message.includes('Network') ||
          e.message.includes('fetch') ||
          e.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor.'
        : e instanceof Error
          ? e.message
          : 'Erro ao criar conta.';
      const field = (e as any)?.field as string | undefined;
      if (field && fieldRefs.current[field]) {
        setErrors({ [field]: enrichRateLimit(msg) });
        scrollToField(field);
      } else {
        setErrors({ geral: enrichRateLimit(msg) });
      }
    } finally {
      setLoading(false);
    }
  }, [form, validate, registrar, onCadastroSuccess, router, scrollToField, pinCoords, endereco]);

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>Portal do Lojista</Text>
        <Text style={styles.topSub}>Venda no Shopping Digital em minutos.</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Criar conta</Text>
        <Text style={styles.cardSub}>Preencha os dados da sua loja para começar</Text>

        <View
          ref={(r) => {
            fieldRefs.current.cnpj = r;
          }}
        >
          <Field
            label="CNPJ"
            value={form.cnpj}
            onChange={(v) => setField('cnpj', formatCNPJ(v))}
            placeholder="00.000.000/0001-00"
            keyboardType="numeric"
            autoComplete="off"
            textContentType="none"
            error={errors.cnpj}
            onBlur={blurCnpj}
            isValid={!errors.cnpj && validateCNPJ(form.cnpj)}
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.nomeLoja = r;
          }}
        >
          <Field
            label="NOME DA LOJA"
            value={form.nomeLoja}
            onChange={(v) => setField('nomeLoja', v)}
            placeholder="Ex: Loja do Chico — Calçados"
            autoCapitalize="words"
            autoComplete="organization"
            textContentType="organizationName"
            error={errors.nomeLoja}
            isValid={!errors.nomeLoja && form.nomeLoja.trim().length > 0}
          />
        </View>

        <View
          ref={(r) => {
            fieldRefs.current.telefone = r;
          }}
        >
          <Text style={styles.fieldLabel}>TELEFONE / WHATSAPP</Text>
          <PhoneInput
            value={form.telefone}
            onChange={(local, full) => {
              setForm((f) => ({ ...f, telefone: local, telefoneCompleto: full }));
              clearError('telefone');
            }}
            onBlur={blurTelefone}
            error={errors.telefone}
          />
        </View>

        <View
          ref={(r) => {
            fieldRefs.current.email = r;
          }}
        >
          <Field
            label="EMAIL"
            value={form.email}
            onChange={(v) => setField('email', v)}
            placeholder="loja@email.com"
            keyboardType="email-address"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
            onBlur={blurEmail}
            isValid={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())}
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.senha = r;
          }}
        >
          <Field
            label="SENHA"
            value={form.senha}
            onChange={(v) => setField('senha', v)}
            placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.senha}
            isValid={
              !errors.senha &&
              form.senha.length >= 8 &&
              /[A-Z]/.test(form.senha) &&
              /[0-9]/.test(form.senha)
            }
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.confirmarSenha = r;
          }}
        >
          <Field
            label="CONFIRMAR SENHA"
            value={form.confirmarSenha}
            onChange={(v) => setField('confirmarSenha', v)}
            placeholder="Repita a senha"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirmarSenha}
            isValid={
              !errors.confirmarSenha &&
              form.confirmarSenha.length > 0 &&
              form.confirmarSenha === form.senha
            }
          />
        </View>

        {/* ── Endereço da loja ─────────────────────────────── */}
        <View style={styles.enderecoSection}>
          <View style={styles.enderecoTitleRow}>
            <Text style={styles.enderecoTitle}>ENDEREÇO DA LOJA</Text>
            <Text style={styles.enderecoOpcional}>obrigatório</Text>
          </View>

          <View style={styles.gpsBtnRow}>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={usarLocalizacao}
              disabled={locLoading}
              activeOpacity={0.8}
            >
              {locLoading ? (
                <ActivityIndicator size="small" color={colors.orange} />
              ) : (
                <Ionicons name="location" size={15} color={colors.orange} />
              )}
              <Text style={styles.gpsBtnText}>
                {locLoading ? 'Obtendo localização...' : 'Usar minha localização'}
              </Text>
            </TouchableOpacity>

            {!!pinCoords && !locLoading && (
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => {
                  setPinCoords(null);
                  setEndereco({ cep: '', rua: '', numero: '', bairro: '' });
                  clearError('cep', 'rua', 'bairro', 'localizacao');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle-outline" size={15} color={colors.n600} />
                <Text style={styles.clearBtnText}>Limpar</Text>
              </TouchableOpacity>
            )}
          </View>

          {!!errors.localizacao && (
            <Text style={[styles.errorGeral, { textAlign: 'left', marginBottom: 8 }]}>
              {errors.localizacao}
            </Text>
          )}

          {pinCoords && (
            <View style={styles.mapContainer}>
              <LocationPickerMap
                lat={pinCoords.lat}
                lng={pinCoords.lng}
                onLocationChange={handlePinMoved}
                style={{ flex: 1 }}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              ref={(r) => {
                fieldRefs.current.cep = r;
              }}
              style={{ flex: 1 }}
            >
              <Field
                label="CEP"
                value={endereco.cep}
                onChange={(v) => {
                  setEnderecoField('cep', v.replace(/\D/g, '').slice(0, 8));
                  clearError('cep');
                }}
                placeholder="49000000"
                keyboardType="numeric"
                autoComplete="off"
                textContentType="none"
                maxLength={8}
                error={errors.cep}
                isValid={!errors.cep && endereco.cep.length === 8}
              />
            </View>
            <View
              ref={(r) => {
                fieldRefs.current.bairro = r;
              }}
              style={{ flex: 2 }}
            >
              <Field
                label="BAIRRO"
                value={endereco.bairro}
                onChange={(v) => {
                  setEnderecoField('bairro', v);
                  clearError('bairro');
                }}
                placeholder="Atalaia"
                error={errors.bairro}
                isValid={!errors.bairro && endereco.bairro.trim().length > 0}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View
              ref={(r) => {
                fieldRefs.current.rua = r;
              }}
              style={{ flex: 1 }}
            >
              <Field
                label="RUA / AV."
                value={endereco.rua}
                onChange={(v) => {
                  setEnderecoField('rua', v);
                  clearError('rua');
                }}
                placeholder="Av. Beira Mar"
                error={errors.rua}
                isValid={!errors.rua && endereco.rua.trim().length > 0}
              />
            </View>
            <View style={{ width: 76, flexShrink: 0, overflow: 'hidden' }}>
              <Field
                label="Nº"
                value={endereco.numero}
                onChange={(v) => setEnderecoField('numero', v.replace(/\D/g, '').slice(0, 7))}
                placeholder="100"
                keyboardType="numeric"
                maxLength={7}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          ref={(r) => {
            fieldRefs.current.termos = r as any;
          }}
          style={styles.termosRow}
          onPress={() => {
            setAceitouTermos((v) => !v);
            clearError('termos');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={aceitouTermos ? 'checkbox' : 'square-outline'}
            size={20}
            color={errors.termos ? '#E24B4A' : aceitouTermos ? colors.orange : colors.n300}
          />
          <Text style={styles.terms}>
            Li e aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text> da AjuLabs.
          </Text>
        </TouchableOpacity>
        {errors.termos ? (
          <Text style={[styles.errorGeral, { textAlign: 'left', marginTop: 4 }]}>
            {errors.termos}
          </Text>
        ) : null}

        {errors.geral ? <Text style={styles.errorGeral}>{errors.geral}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCadastro}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Criar minha conta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.loginLink}>Entrar no painel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },
  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  topTitle: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  topSub: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  card: {
    backgroundColor: colors.n0,
    borderRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardContent: { padding: 28, paddingBottom: 0 },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.navy },
  cardSub: { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
    marginTop: 2,
  },
  errorGeral: {
    fontSize: 13,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 13, color: colors.n600 },
  loginLink: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  enderecoSection: {
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  enderecoTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  enderecoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  enderecoOpcional: { fontSize: 11, color: colors.orange600, fontStyle: 'italic' },
  gpsBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.orange,
    paddingHorizontal: 14,
  },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: colors.orange },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.n200,
    paddingHorizontal: 12,
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: colors.n600 },
  mapContainer: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },
  termosRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14 },
  terms: { flex: 1, fontSize: 11, color: colors.n500, lineHeight: 16 },
  termsLink: { color: colors.orange, fontWeight: '600' },
});
