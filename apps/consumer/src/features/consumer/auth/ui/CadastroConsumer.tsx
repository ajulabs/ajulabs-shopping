import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { colors, AjuLogo } from '@ajulabs/theme';
import { useAuthStore } from '../../../../store';
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
  const [endereco, setEndereco] = useState<EnderecoConsumer>({
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
  });
  const [locLoading, setLocLoading] = useState(false);
  const [pinCoords, setPinCoords] = useState<{ lat: number; lng: number } | null>(null);

  const setEnderecoField = useCallback((key: keyof EnderecoConsumer, value: string) => {
    setEndereco((prev) => ({ ...prev, [key]: value }));
  }, []);

  const usarLocalizacao = useCallback(async () => {
    setLocLoading(true);
    setErrors((e) => ({ ...e, localizacao: '' }));
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
    } catch {
      /* silently keep previous values */
    }
  }, []);

  const clearError = (key: string) => setErrors((e) => ({ ...e, [key]: '' }));

  const blurNome = () => {
    const parts = nome.trim().split(/\s+/);
    if (nome.trim() && (parts.length < 2 || parts[1].length < 2))
      setErrors((e) => ({ ...e, nome: 'Informe seu nome e sobrenome.' }));
  };

  const blurCpf = () => {
    if (cpf.trim() && !validateCPF(cpf)) setErrors((e) => ({ ...e, cpf: 'CPF inválido.' }));
  };

  const blurEmail = () => {
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))
      setErrors((e) => ({ ...e, email: 'Email inválido.' }));
  };

  const validate = useCallback(() => {
    const errs: Record<string, string> = {};
    const nomeParts = nome.trim().split(/\s+/);
    if (nomeParts.length < 2 || nomeParts[1].length < 2)
      errs.nome = 'Informe seu nome e sobrenome.';
    if (!validateCPF(cpf)) errs.cpf = 'CPF inválido.';
    if (telefoneCompleto.replace(/\D/g, '').length < 10) errs.telefone = 'Telefone inválido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = 'Email inválido.';
    if (senha.length < 8) errs.senha = 'A senha deve ter pelo menos 8 caracteres.';
    else if (!/[A-Z]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 letra maiúscula.';
    else if (!/[0-9]/.test(senha)) errs.senha = 'A senha deve conter pelo menos 1 número.';
    if (senha !== confirmar) errs.confirmar = 'As senhas não coincidem.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [nome, cpf, telefoneCompleto, email, senha, confirmar]);

  const handleCadastro = useCallback(async () => {
    if (!validate()) return;
    setLoading(true);
    console.log(
      '[Consumer][Cadastro] Enviando cadastro — nome:',
      nome,
      '| cpf:',
      cpf,
      '| email:',
      email,
    );
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
      console.error('[Consumer][Cadastro] Erro:', err);
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
      setErrors({ geral: msg });
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
        style={styles.card}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.cardTitle}>Seus dados</Text>
        <Text style={styles.cardSub}>Preencha para criar sua conta</Text>

        <Field
          label="NOME COMPLETO"
          value={nome}
          onChange={(v) => {
            setNome(v.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''));
            clearError('nome');
          }}
          placeholder="João da Silva"
          autoCapitalize="words"
          error={errors.nome}
          onBlur={blurNome}
        />
        <Field
          label="CPF"
          value={cpf}
          onChange={(v) => {
            setCpf(formatCPF(v));
            clearError('cpf');
          }}
          placeholder="000.000.000-00"
          keyboardType="numeric"
          error={errors.cpf}
          onBlur={blurCpf}
        />
        <Text style={styles.phoneLabel}>TELEFONE</Text>
        <PhoneInput
          value={telefone}
          onChange={(local, full) => {
            setTelefone(local);
            setTelefoneCompleto(full);
            clearError('telefone');
          }}
          error={errors.telefone}
        />
        <Field
          label="EMAIL"
          value={email}
          onChange={(v) => {
            setEmail(v);
            clearError('email');
          }}
          placeholder="voce@email.com"
          keyboardType="email-address"
          error={errors.email}
          onBlur={blurEmail}
        />
        <Field
          label="SENHA"
          value={senha}
          onChange={(v) => {
            setSenha(v);
            clearError('senha');
          }}
          placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
          secureTextEntry
          error={errors.senha}
        />
        <Field
          label="CONFIRMAR SENHA"
          value={confirmar}
          onChange={(v) => {
            setConfirmar(v);
            clearError('confirmar');
          }}
          placeholder="Repita a senha"
          secureTextEntry
          error={errors.confirmar}
        />

        {/* ── Endereço ─────────────────────────────────────── */}
        <View style={styles.enderecoSection}>
          <Text style={styles.enderecoTitle}>ENDEREÇO</Text>

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
            <View style={{ flex: 1 }}>
              <Field
                label="CEP"
                value={endereco.cep}
                onChange={(v) => setEnderecoField('cep', v.replace(/\D/g, '').slice(0, 8))}
                placeholder="49000000"
                keyboardType="numeric"
                maxLength={8}
              />
            </View>
            <View style={{ flex: 2 }}>
              <Field
                label="BAIRRO"
                value={endereco.bairro}
                onChange={(v) => setEnderecoField('bairro', v)}
                placeholder="Atalaia"
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="RUA / AV."
                value={endereco.rua}
                onChange={(v) => setEnderecoField('rua', v)}
                placeholder="Av. Beira Mar"
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

        <Text style={styles.termos}>
          Ao criar sua conta, você concorda com nossos{' '}
          <Text style={styles.termosLink}>Termos de Uso</Text> e{' '}
          <Text style={styles.termosLink}>Política de Privacidade</Text>.
        </Text>

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

  termos: { fontSize: 11, color: colors.n500, textAlign: 'center', marginTop: 14, lineHeight: 16 },
  termosLink: { color: colors.orange, fontWeight: '600' },

  enderecoSection: {
    marginBottom: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.n100,
  },
  enderecoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.n600,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: colors.orange },
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
