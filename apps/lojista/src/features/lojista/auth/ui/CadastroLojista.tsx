import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, AjuLogo } from '../../../../theme';
import { useCadastro } from '../model/useCadastro';
import { validateCNPJ } from '../lib/validateCNPJ';
import { Field } from './components/Field';
import { PhoneInput } from './components/PhoneInput';
import { EnderecoSection } from './components/EnderecoSection';
import { TermosCheckbox } from './components/TermosCheckbox';

interface CadastroLojistaProps {
  onCadastroSuccess?: () => void;
}

export function CadastroLojista({ onCadastroSuccess }: CadastroLojistaProps) {
  const insets = useSafeAreaInsets();
  const {
    loading,
    errors,
    aceitouTermos,
    form,
    endereco,
    locLoading,
    pinCoords,
    scrollRef,
    fieldPositions,
    setField,
    setTelefone,
    setEnderecoField,
    clearError,
    toggleTermos,
    usarLocalizacao,
    handlePinMoved,
    limparEndereco,
    blurCnpj,
    blurEmail,
    blurTelefone,
    handleCadastro,
    confirmarSaida,
    formatCNPJ,
  } = useCadastro(onCadastroSuccess);

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
          onLayout={(e) => {
            fieldPositions.current.cnpj = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.nomeLoja = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.telefone = e.nativeEvent.layout.y;
          }}
        >
          <Text style={styles.fieldLabel}>TELEFONE / WHATSAPP</Text>
          <PhoneInput
            value={form.telefone}
            onChange={setTelefone}
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
          onLayout={(e) => {
            fieldPositions.current.senha = e.nativeEvent.layout.y;
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
          onLayout={(e) => {
            fieldPositions.current.confirmarSenha = e.nativeEvent.layout.y;
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
        <EnderecoSection
          endereco={endereco}
          errors={errors}
          locLoading={locLoading}
          pinCoords={pinCoords}
          fieldPositions={fieldPositions}
          onUsarLocalizacao={usarLocalizacao}
          onLimpar={limparEndereco}
          onPinMoved={handlePinMoved}
          onChangeEndereco={setEnderecoField}
          clearError={clearError}
        />

        <TermosCheckbox
          aceitou={aceitouTermos}
          error={errors.termos}
          onToggle={toggleTermos}
          onLayout={(e) => {
            fieldPositions.current.termos = e.nativeEvent.layout.y;
          }}
        />

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
          <TouchableOpacity onPress={confirmarSaida} activeOpacity={0.8}>
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
});
