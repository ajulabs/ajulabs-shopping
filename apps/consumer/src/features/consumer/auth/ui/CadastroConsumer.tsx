import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  findNodeHandle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';
import { enrichRateLimit } from '../../../../utils/enrichRateLimit';
import { formatCPF, validateCPF } from '../lib/formatCPF';
import { Field } from './components/Field';
import { PhoneInput } from './components/PhoneInput';
import { LocationPickerMap } from '../../../../components/LocationPickerMap';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

interface EnderecoConsumer {
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
}

interface CadastroConsumerProps {
  onCadastroSuccess?: () => void;
}

export function CadastroConsumer({ onCadastroSuccess }: CadastroConsumerProps) {
  const router = useRouter();
  const registrar = useAuthStore((s) => s.registrar);
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [telefoneCompleto, setTelefoneCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [endereco, setEndereco] = useState<EnderecoConsumer>({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
  });
  const [locLoading, setLocLoading] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const fieldRefs = useRef<Record<string, View | null>>({});

  const setEnderecoField = useCallback((key: keyof EnderecoConsumer, value: string) => {
    setEndereco((prev) => ({ ...prev, [key]: value }));
  }, []);

  const usarLocalizacao = useCallback(async () => {
    setLocLoading(true);
    clearError('localizacao');
    try {
      let lat: number, lng: number;
      if (Platform.OS === 'web') {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }),
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErrors((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
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
      setPinCoords({ lat, lng });
    } catch {
      setErrors((e) => ({ ...e, localizacao: 'Não foi possível obter sua localização.' }));
    } finally {
      setLocLoading(false);
    }
  }, []);

  const handlePinMoved = useCallback(async (lat: number, lng: number) => {
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
    } catch {
      /* silently keep previous values */
    }
  }, []);

  const clearError = (...keys: string[]) =>
    setErrors((prev) => {
      if (keys.every((k) => !prev[k])) return prev;
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });

  const checkDisponivel = useCallback(
    async (field: 'cpf' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/usuario/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cpf: 'Este CPF já possui uma conta. Faça login ou use outro CPF.',
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

  const blurNome = () => {
    const trimmed = nome.trim();
    if (!trimmed || !trimmed.includes(' ')) return;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 2 || parts[1].length < 2)
      setErrors((e) => ({ ...e, nome: 'Informe seu nome e sobrenome.' }));
  };

  const blurCpf = useCallback(async () => {
    const digits = cpf.replace(/\D/g, '');
    if (!digits) return;
    if (digits.length < 11) {
      setErrors((e) => ({ ...e, cpf: 'CPF incompleto — informe os 11 dígitos.' }));
    } else if (!validateCPF(cpf)) {
      setErrors((e) => ({ ...e, cpf: 'CPF inválido. Verifique os números digitados.' }));
    } else {
      await checkDisponivel('cpf', digits);
    }
  }, [cpf, checkDisponivel]);

  const blurEmail = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setErrors((e) => ({ ...e, email: 'Email inválido.' }));
    } else {
      await checkDisponivel('email', trimmed);
    }
  }, [email, checkDisponivel]);

  const blurTelefone = useCallback(async () => {
    const digits = telefoneCompleto.replace(/\D/g, '');
    if (digits.length < 10) return;
    await checkDisponivel('telefone', telefoneCompleto.replace(/[^\d+]/g, ''));
  }, [telefoneCompleto, checkDisponivel]);

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    const nomeParts = nome.trim().split(/\s+/);
    if (nomeParts.length < 2 || nomeParts[1].length < 2)
      errs.nome = 'Informe seu nome e sobrenome.';
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length < 11) errs.cpf = 'CPF incompleto — informe os 11 dígitos.';
    else if (!validateCPF(cpf)) errs.cpf = 'CPF inválido. Verifique os números digitados.';
    if (telefoneCompleto.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errs.email = 'Email inválido.';
    if (senha.length < 8) errs.senha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 número.';
    if (!confirmar) errs.confirmar = 'Confirme sua senha.';
    else if (senha !== confirmar) errs.confirmar = 'As senhas não coincidem.';
    const hasAnyAddress = endereco.cep || endereco.rua.trim() || endereco.bairro.trim();
    if (hasAnyAddress) {
      if (!endereco.cep) {
        errs.cep = 'Informe o CEP para completar o endereço.';
      } else if (endereco.cep.length < 8) {
        errs.cep = 'CEP incompleto — informe os 8 dígitos (somente números).';
      }
      if (!endereco.rua.trim()) {
        errs.rua = 'Informe a rua ou avenida.';
      }
      if (!endereco.bairro.trim()) {
        errs.bairro = 'Informe o bairro.';
      }
    }
    if (!aceitouTermos) errs.termos = 'Aceite os Termos de Uso para continuar.';
    setErrors(errs);
    return errs;
  }, [
    nome,
    cpf,
    telefoneCompleto,
    email,
    senha,
    confirmar,
    endereco.cep,
    endereco.rua,
    endereco.bairro,
    aceitouTermos,
  ]);

  const scrollToField = useCallback((key: string) => {
    const ref = fieldRefs.current[key];
    if (!ref) return;
    if (Platform.OS === 'web') {
      (ref as any).scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    } else {
      const node = findNodeHandle(scrollRef.current);
      if (node) {
        ref.measureLayout(
          node,
          (_, y) => scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true }),
          () => {},
        );
      }
    }
  }, []);

  const handleCadastro = useCallback(async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      const order = [
        'nome',
        'cpf',
        'telefone',
        'email',
        'senha',
        'confirmar',
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
      await registrar({ nome, cpf, telefone: telefoneCompleto, email, senha });

      // Se endereço preenchido, salva como endereço padrão
      if (endereco.rua.trim() && endereco.cep.trim()) {
        const { token } = useAuthStore.getState();
        if (token) {
          await fetch(`${LAPI}/enderecos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              apelido: 'Casa',
              rua: endereco.rua,
              numero: endereco.numero || 's/n',
              bairro: endereco.bairro,
              cep: endereco.cep.replace(/\D/g, ''),
              cidade: 'Aracaju',
              ...(pinCoords ? { lat: pinCoords.lat, lng: pinCoords.lng, geoSource: 'gps' } : {}),
            }),
          }).catch(() => {});
        }
      }

      onCadastroSuccess?.();
      router.replace('/(consumer)/chat');
    } catch (err) {
      const isNetwork =
        err instanceof Error &&
        (err.message.includes('Network') ||
          err.message.includes('fetch') ||
          err.message.includes('Failed'));
      const msg = isNetwork
        ? 'Sem conexão com o servidor. Verifique sua internet.'
        : err instanceof Error
          ? err.message
          : 'Erro ao criar conta. Tente novamente.';
      const field = (err as any)?.field as string | undefined;
      if (field && fieldRefs.current[field]) {
        setErrors({ [field]: enrichRateLimit(msg) });
        scrollToField(field);
      } else {
        setErrors({ geral: enrichRateLimit(msg) });
      }
    } finally {
      setLoading(false);
    }
  }, [validate, registrar, nome, cpf, telefoneCompleto, email, senha, onCadastroSuccess, router]);

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ marginBottom: 16 }}>
          <AjuLogo size={52} />
        </View>
        <Text style={styles.topTitle}>Criar conta</Text>
        <Text style={styles.topSub}>Compre nos melhores lojistas de Aracaju.</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Seus dados</Text>
        <Text style={styles.cardSub}>Preencha para criar sua conta</Text>

        <View
          ref={(r) => {
            fieldRefs.current.nome = r;
          }}
        >
          <Field
            label="NOME COMPLETO"
            value={nome}
            onChange={(v) => {
              setNome(v.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''));
              clearError('nome');
            }}
            placeholder="João da Silva"
            autoCapitalize="words"
            autoCorrect={false}
            autoComplete="name"
            textContentType="name"
            error={errors.nome}
            onBlur={blurNome}
            isValid={
              !errors.nome &&
              (() => {
                const p = nome.trim().split(/\s+/).filter(Boolean);
                return p.length >= 2 && p[1].length >= 2;
              })()
            }
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.cpf = r;
          }}
        >
          <Field
            label="CPF"
            value={cpf}
            onChange={(v) => {
              setCpf(formatCPF(v));
              clearError('cpf');
            }}
            placeholder="000.000.000-00"
            keyboardType="numeric"
            autoComplete="off"
            textContentType="none"
            error={errors.cpf}
            onBlur={blurCpf}
            isValid={!errors.cpf && validateCPF(cpf)}
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.telefone = r;
          }}
        >
          <Text style={styles.phoneLabel}>TELEFONE</Text>
          <PhoneInput
            value={telefone}
            onChange={(local, full) => {
              setTelefone(local);
              setTelefoneCompleto(full);
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
            value={email}
            onChange={(v) => {
              setEmail(v);
              clearError('email');
            }}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
            onBlur={blurEmail}
            isValid={!errors.email && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())}
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.senha = r;
          }}
        >
          <Field
            label="SENHA"
            value={senha}
            onChange={(v) => {
              setSenha(v);
              clearError('senha');
            }}
            placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.senha}
            isValid={
              !errors.senha && senha.length >= 8 && /[A-Z]/.test(senha) && /[0-9]/.test(senha)
            }
          />
        </View>
        <View
          ref={(r) => {
            fieldRefs.current.confirmar = r;
          }}
        >
          <Field
            label="CONFIRMAR SENHA"
            value={confirmar}
            onChange={(v) => {
              setConfirmar(v);
              clearError('confirmar');
            }}
            placeholder="Repita a senha"
            secureTextEntry
            autoComplete="new-password"
            textContentType="newPassword"
            error={errors.confirmar}
            isValid={!errors.confirmar && confirmar.length > 0 && confirmar === senha}
          />
        </View>

        {/* ── Endereço ─────────────────────────────────────── */}
        <View style={styles.enderecoSection}>
          <View style={styles.enderecoTitleRow}>
            <Text style={styles.enderecoTitle}>ENDEREÇO</Text>
            <Text style={styles.enderecoOpcional}>opcional — melhora a entrega</Text>
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

          {!!pinCoords && (
            <View style={styles.mapBox}>
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

        {errors.geral ? <Text style={styles.errorGeral}>{errors.geral}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleCadastro}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Criar conta</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.8}>
            <Text style={styles.loginLink}>Entrar</Text>
          </TouchableOpacity>
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
          <Text style={styles.termos}>
            Li e aceito os <Text style={styles.termosLink}>Termos de Uso</Text> e a{' '}
            <Text style={styles.termosLink}>Política de Privacidade</Text>.
          </Text>
        </TouchableOpacity>
        {errors.termos ? (
          <Text style={[styles.errorGeral, { textAlign: 'left', marginTop: 4 }]}>
            {errors.termos}
          </Text>
        ) : null}

        <View style={{ height: 32 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          by <Text style={styles.footerBrand}>AjuLabs</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy },

  top: { paddingTop: 52, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 24,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  cardSub: { fontSize: 13, color: colors.n600, marginTop: 4, marginBottom: 22 },
  phoneLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 5,
    marginTop: 14,
  },

  errorGeral: {
    fontSize: 13,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },

  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  loginText: { fontSize: 13, color: colors.n600 },
  loginLink: { fontSize: 13, fontWeight: '600', color: colors.orange600 },

  termosRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 14,
  },
  termos: { flex: 1, fontSize: 11, color: colors.n500, lineHeight: 16 },
  termosLink: { color: colors.orange, fontWeight: '600' },

  enderecoSection: {
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  enderecoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  enderecoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  enderecoOpcional: {
    fontSize: 11,
    color: colors.n500,
    fontStyle: 'italic',
  },
  gpsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
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
  mapBox: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.n200,
  },

  footer: { paddingVertical: 16, alignItems: 'center', backgroundColor: colors.navy },
  footerText: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },
  footerBrand: { color: 'rgba(255,255,255,0.65)', fontWeight: '600' },
});
