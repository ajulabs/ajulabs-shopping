import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, AjuLogo } from '@ajulabs/theme';
import { formatCPF, validateCPF } from '../lib/formatCPF';
import { Field } from './components/Field';
import { PhoneInput } from './components/PhoneInput';
import { LocationPickerMap } from '../../../../shared/ui/LocationPickerMap';
import { useCadastroForm } from '../model/useCadastroForm';

interface CadastroConsumerProps {
  onCadastroSuccess?: () => void;
}

export function CadastroConsumer({ onCadastroSuccess }: CadastroConsumerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    nome,
    setNome,
    cpf,
    setCpf,
    telefone,
    setTelefone,
    telefoneCompleto,
    setTelefoneCompleto,
    email,
    setEmail,
    senha,
    setSenha,
    confirmar,
    setConfirmar,
    loading,
    errors,
    clearError,
    aceitouTermos,
    setAceitouTermos,
    endereco,
    setEnderecoField,
    locLoading,
    usarLocalizacao,
    handlePinMoved,
    pinCoords,
    blurNome,
    blurCpf,
    blurEmail,
    blurTelefone,
    handleCadastro,
    confirmarSaida,
    limparEndereco,
    scrollRef,
    fieldPositions,
  } = useCadastroForm(onCadastroSuccess);

  return (
    <View style={styles.container}>
      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={confirmarSaida} activeOpacity={0.8}>
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
          onLayout={(e) => {
            fieldPositions.current.nome = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.cpf = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.telefone = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.email = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.senha = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.confirmar = e.nativeEvent.layout.y;
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
                onPress={limparEndereco}
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
              onLayout={(e) => {
                fieldPositions.current.cep = e.nativeEvent.layout.y;
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
              onLayout={(e) => {
                fieldPositions.current.bairro = e.nativeEvent.layout.y;
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
              onLayout={(e) => {
                fieldPositions.current.rua = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.termos = e.nativeEvent.layout.y;
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

  top: { paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center' },
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
