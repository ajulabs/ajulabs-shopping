import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useAuthEntregadorStore } from '../../../../store';
import { EntregadorService } from '@ajulabs/api-client';
import { formatCPF, validateCPF } from '../../auth/lib/formatCPF';
import { PhoneInput } from './PhoneInput';
import { LocationPickerMap } from '../../../../components/LocationPickerMap';
import { enrichRateLimit } from '../../../../utils/enrichRateLimit';

const LAPI =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '') + '/v1';

// ─── Formatadores ────────────────────────────────────────────────
function formatTel(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d[2]} ${d.slice(3, 7)}-${d.slice(7)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
}

// ─── Componentes locais ───────────────────────────────────────────
type KB = 'default' | 'email-address' | 'numeric' | 'phone-pad';

function Input({
  value,
  onChange,
  placeholder,
  secureTextEntry,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect,
  autoComplete,
  textContentType,
  maxLength,
  onBlur: onBlurProp,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KB;
  autoCapitalize?: 'none' | 'words' | 'sentences';
  autoCorrect?: boolean;
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  maxLength?: number;
  onBlur?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  const [shown, setShown] = useState(false);
  return (
    <View style={[s.input, focused && s.inputFocused]}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9099B3"
        secureTextEntry={secureTextEntry && !shown}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        autoComplete={autoComplete}
        textContentType={textContentType}
        maxLength={maxLength}
        style={s.inputInner}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlurProp?.();
        }}
      />
      {secureTextEntry && (
        <TouchableOpacity onPress={() => setShown((v) => !v)} hitSlop={10} style={s.eyeBtn}>
          <Ionicons name={shown ? 'eye-off-outline' : 'eye-outline'} size={18} color="#9099B3" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children}
      {error ? <Text style={s.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ─── Bancos e Pix ────────────────────────────────────────────────
const PIX_TIPOS = [
  { id: 'cpf', label: 'CPF', placeholder: '000.000.000-00', keyboard: 'numeric' as KB },
  { id: 'email', label: 'Email', placeholder: 'seu@email.com', keyboard: 'email-address' as KB },
  { id: 'celular', label: 'Celular', placeholder: '(79) 9 0000-0000', keyboard: 'phone-pad' as KB },
  {
    id: 'aleatoria',
    label: 'Aleatória',
    placeholder: 'Chave aleatória',
    keyboard: 'default' as KB,
  },
];

const BANCOS = [
  { codigo: '001', nome: 'Banco do Brasil' },
  { codigo: '003', nome: 'Banco da Amazônia' },
  { codigo: '004', nome: 'Banco do Nordeste' },
  { codigo: '021', nome: 'Banestes' },
  { codigo: '025', nome: 'Banco Alfa' },
  { codigo: '033', nome: 'Santander' },
  { codigo: '041', nome: 'Banrisul' },
  { codigo: '047', nome: 'Banese' },
  { codigo: '070', nome: 'BRB' },
  { codigo: '077', nome: 'Banco Inter' },
  { codigo: '085', nome: 'Via Credi' },
  { codigo: '099', nome: 'Uniprime' },
  { codigo: '104', nome: 'Caixa Econômica Federal' },
  { codigo: '121', nome: 'Agibank' },
  { codigo: '133', nome: 'Cresol' },
  { codigo: '136', nome: 'Unicred' },
  { codigo: '197', nome: 'Stone' },
  { codigo: '208', nome: 'BTG Pactual' },
  { codigo: '212', nome: 'Banco Original' },
  { codigo: '218', nome: 'BS2' },
  { codigo: '224', nome: 'Banco Fibra' },
  { codigo: '237', nome: 'Bradesco' },
  { codigo: '243', nome: 'Banco Master' },
  { codigo: '246', nome: 'ABC Brasil' },
  { codigo: '260', nome: 'Nubank' },
  { codigo: '290', nome: 'PagBank' },
  { codigo: '301', nome: 'PicPay' },
  { codigo: '318', nome: 'Banco BMG' },
  { codigo: '323', nome: 'Mercado Pago' },
  { codigo: '336', nome: 'C6 Bank' },
  { codigo: '341', nome: 'Itaú Unibanco' },
  { codigo: '348', nome: 'XP Investimentos' },
  { codigo: '364', nome: 'EFÍ (Gerencianet)' },
  { codigo: '376', nome: 'JP Morgan' },
  { codigo: '389', nome: 'Banco Mercantil' },
  { codigo: '403', nome: 'Cora' },
  { codigo: '422', nome: 'Banco Safra' },
  { codigo: '456', nome: 'Sicredi' },
  { codigo: '461', nome: 'Asaas' },
  { codigo: '477', nome: 'Citibank' },
  { codigo: '487', nome: 'Deutsche Bank' },
  { codigo: '505', nome: 'Credit Suisse' },
  { codigo: '536', nome: 'Neon' },
  { codigo: '600', nome: 'Banco Luso Brasileiro' },
  { codigo: '604', nome: 'Banco Industrial' },
  { codigo: '611', nome: 'Banco Paulista' },
  { codigo: '612', nome: 'Banco Guanabara' },
  { codigo: '623', nome: 'Banco Pan' },
  { codigo: '633', nome: 'Banco Rendimento' },
  { codigo: '637', nome: 'Banco Sofisa' },
  { codigo: '643', nome: 'Banco Pine' },
  { codigo: '655', nome: 'Banco Votorantim' },
  { codigo: '707', nome: 'Daycoval' },
  { codigo: '739', nome: 'Banco Cetelem' },
  { codigo: '745', nome: 'Citibank N.A.' },
  { codigo: '746', nome: 'Banco Modal' },
  { codigo: '747', nome: 'Rabobank' },
  { codigo: '748', nome: 'Sicredi Cooperativo' },
  { codigo: '751', nome: 'Scotiabank' },
  { codigo: '755', nome: 'Bank of America' },
  { codigo: '756', nome: 'Sicoob' },
];

// ─── Tipos ────────────────────────────────────────────────────────
const TRANSPORTES = [
  {
    id: 'bike',
    label: 'Bicicleta',
    icon: 'bicycle',
    lib: 'Ionicons' as const,
    rate: 'R$ 6/corrida',
    desc: 'Sem placa, leve e econômico',
  },
  {
    id: 'moto',
    label: 'Moto',
    icon: 'motorbike',
    lib: 'MaterialCommunityIcons' as const,
    rate: 'R$ 10/corrida',
    desc: 'Rápido e mais alcance',
  },
  {
    id: 'carro',
    label: 'Carro',
    icon: 'car',
    lib: 'Ionicons' as const,
    rate: 'R$ 14/corrida',
    desc: 'Para volumes maiores',
  },
];

type Data = Record<string, string>;
interface StepProps {
  data: Data;
  up: (k: string, v: string) => void;
}

// ─── Passo 1: Dados pessoais ──────────────────────────────────────
function StepPessoal({
  data,
  up,
  erros,
  photoUri,
  onPickPhoto,
  onGps,
  locLoading,
  gpsCoords,
  onPinMoved,
  onClearGps,
  onBlurCpf,
  onBlurEmail,
}: StepProps & {
  erros: Record<string, string>;
  photoUri: string | null;
  onPickPhoto: () => void;
  onGps: () => void;
  locLoading: boolean;
  gpsCoords: { lat: number; lng: number } | null;
  onPinMoved: (lat: number, lng: number) => void;
  onClearGps: () => void;
  onBlurCpf?: () => void;
  onBlurEmail?: () => void;
}) {
  return (
    <View>
      <TouchableOpacity
        style={[s.photoBtn, !!erros.foto && s.photoBtnError]}
        activeOpacity={0.8}
        onPress={onPickPhoto}
      >
        {photoUri ? (
          <Image
            source={{ uri: photoUri }}
            style={{ width: '100%', height: '100%', borderRadius: 55 }}
          />
        ) : (
          <>
            <Ionicons name="camera" size={26} color={erros.foto ? '#E24B4A' : '#F2760F'} />
            <Text style={[s.photoBtnText, !!erros.foto && { color: '#E24B4A' }]}>
              Foto de perfil
            </Text>
          </>
        )}
      </TouchableOpacity>
      {erros.foto ? (
        <Text style={[s.fieldError, { textAlign: 'center', marginTop: 4 }]}>{erros.foto}</Text>
      ) : (
        <Text style={s.photoHint}>Sua foto aparece para o cliente durante a entrega</Text>
      )}

      <Field label="Nome completo" error={erros.nome}>
        <Input
          value={data.nome || ''}
          onChange={(v) => up('nome', v)}
          placeholder="Nome e Sobrenome"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
        />
      </Field>
      <Field label="CPF" error={erros.cpf}>
        <Input
          value={data.cpf || ''}
          onChange={(v) => up('cpf', formatCPF(v))}
          placeholder="000.000.000-00"
          keyboardType="numeric"
          autoComplete="off"
          textContentType="none"
          onBlur={onBlurCpf}
        />
      </Field>
      <Field label="Celular" error={erros.celular}>
        <PhoneInput
          value={data.celular || ''}
          onChange={(local, full) => {
            up('celular', local);
            up('celularCompleto', full);
          }}
          error={undefined}
        />
      </Field>
      <Field label="Email" error={erros.email}>
        <Input
          value={data.email || ''}
          onChange={(v) => up('email', v)}
          placeholder="seu@email.com"
          keyboardType="email-address"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          onBlur={onBlurEmail}
        />
      </Field>
      <Field label="Senha" error={erros.senha}>
        <Input
          value={data.senha || ''}
          onChange={(v) => up('senha', v)}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </Field>
      <Field label="Confirmar senha" error={erros.confirmarSenha}>
        <Input
          value={data.confirmarSenha || ''}
          onChange={(v) => up('confirmarSenha', v)}
          placeholder="Repita a senha"
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
        />
      </Field>

      <View style={s.gpsSection}>
        <View style={s.gpsTitleRow}>
          <Text style={s.gpsSectionTitle}>LOCALIZAÇÃO</Text>
          <Text style={s.gpsSectionOpcional}>opcional</Text>
        </View>

        <View style={s.gpsBtnRow}>
          <TouchableOpacity
            style={[s.gpsBtn, !!gpsCoords && s.gpsBtnDone]}
            onPress={onGps}
            disabled={locLoading}
            activeOpacity={0.8}
          >
            {locLoading ? (
              <ActivityIndicator size="small" color="#F2760F" />
            ) : (
              <Ionicons
                name={gpsCoords ? 'checkmark-circle' : 'location'}
                size={16}
                color={gpsCoords ? '#039855' : '#F2760F'}
              />
            )}
            <Text style={[s.gpsBtnText, !!gpsCoords && { color: '#039855' }]}>
              {locLoading
                ? 'Obtendo localização...'
                : gpsCoords
                  ? 'Localização capturada'
                  : 'Usar minha localização'}
            </Text>
          </TouchableOpacity>

          {!!gpsCoords && !locLoading && (
            <TouchableOpacity style={s.clearBtn} onPress={onClearGps} activeOpacity={0.8}>
              <Ionicons name="close-circle-outline" size={15} color="#9099B3" />
              <Text style={s.clearBtnText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        {erros.localizacao ? <Text style={s.fieldError}>{erros.localizacao}</Text> : null}

        {!!gpsCoords && (
          <View style={s.mapBox}>
            <LocationPickerMap
              lat={gpsCoords.lat}
              lng={gpsCoords.lng}
              onLocationChange={onPinMoved}
              style={{ flex: 1 }}
            />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Field label="CEP" error={undefined}>
              <Input
                value={data.cep || ''}
                onChange={(v) => up('cep', v.replace(/\D/g, '').slice(0, 8))}
                placeholder="49000000"
                keyboardType="numeric"
                autoComplete="off"
                textContentType="none"
              />
            </Field>
          </View>
          <View style={{ flex: 2 }}>
            <Field label="BAIRRO" error={undefined}>
              <Input
                value={data.bairro || ''}
                onChange={(v) => up('bairro', v)}
                placeholder="Atalaia"
              />
            </Field>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="RUA / AV." error={undefined}>
              <Input
                value={data.rua || ''}
                onChange={(v) => up('rua', v)}
                placeholder="Av. Beira Mar"
              />
            </Field>
          </View>
          <View style={{ width: 76 }}>
            <Field label="Nº" error={undefined}>
              <Input
                value={data.numero || ''}
                onChange={(v) => up('numero', v.replace(/\D/g, '').slice(0, 7))}
                placeholder="100"
                keyboardType="numeric"
              />
            </Field>
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── Passo: Documentos ───────────────────────────────────────────
interface StepDocsProps {
  frenteUri: string | null;
  versoUri: string | null;
  onPickDoc: (lado: 'frente' | 'verso') => void;
  tipoTransporte: string;
}

function StepDocs({ frenteUri, versoUri, onPickDoc, tipoTransporte }: StepDocsProps) {
  const needsCnh = tipoTransporte !== 'bike';
  const docNome = needsCnh ? 'CNH' : 'RG';
  const docs = [
    { key: 'frente' as const, label: `${docNome} — Frente`, uri: frenteUri },
    { key: 'verso' as const, label: `${docNome} — Verso`, uri: versoUri },
  ];
  return (
    <View>
      <View style={s.infoBox}>
        <Ionicons name={needsCnh ? 'card' : 'id-card'} size={16} color="#209CEF" />
        <Text style={s.infoText}>
          {needsCnh
            ? 'Para moto ou carro é obrigatório enviar a CNH (frente e verso).'
            : 'Para bicicleta, envie uma foto do seu RG (frente e verso).'}
        </Text>
      </View>
      {docs.map((doc) => (
        <TouchableOpacity
          key={doc.key}
          style={s.docBtn}
          activeOpacity={0.8}
          onPress={() => onPickDoc(doc.key)}
        >
          {doc.uri ? (
            <Image source={{ uri: doc.uri }} style={s.docThumb} />
          ) : (
            <View style={s.docIcon}>
              <Ionicons name="camera" size={20} color="#F2760F" />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.docTitle}>{doc.label}</Text>
            <Text style={s.docSub}>
              {doc.uri ? 'Toque para trocar' : 'Toque para tirar foto ou escolher da galeria'}
            </Text>
          </View>
          {doc.uri && <Ionicons name="checkmark-circle" size={20} color="#039855" />}
        </TouchableOpacity>
      ))}
      <View style={[s.infoBox, { marginTop: 8 }]}>
        <Ionicons name="shield-checkmark" size={16} color="#209CEF" />
        <Text style={s.infoText}>Análise em até 24h. Seus dados são criptografados.</Text>
      </View>
    </View>
  );
}

// ─── Passo 3: Transporte ──────────────────────────────────────────
function StepTransporte({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  return (
    <View>
      <Text style={s.stepDesc}>Qual meio de transporte você vai usar?</Text>
      {TRANSPORTES.map((t) => {
        const sel = data.transporte === t.id;
        return (
          <TouchableOpacity
            key={t.id}
            style={[s.transporteBtn, sel && s.transporteBtnActive]}
            onPress={() => up('transporte', t.id)}
            activeOpacity={0.85}
          >
            <View style={[s.transporteIcon, sel && { backgroundColor: '#F2760F' }]}>
              {t.lib === 'MaterialCommunityIcons' ? (
                <MaterialCommunityIcons
                  name={t.icon as any}
                  size={24}
                  color={sel ? '#FFFFFF' : '#2A3156'}
                />
              ) : (
                <Ionicons name={t.icon as any} size={24} color={sel ? '#FFFFFF' : '#2A3156'} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[s.transporteLabel, sel && { color: '#F2760F' }]}>{t.label}</Text>
              <Text style={s.transporteDesc}>
                {t.rate} · {t.desc}
              </Text>
            </View>
            {sel && <Ionicons name="checkmark-circle" size={20} color="#F2760F" />}
          </TouchableOpacity>
        );
      })}
      {!!erros.transporte && <Text style={s.fieldError}>{erros.transporte}</Text>}
    </View>
  );
}

function formatPlaca(value: string): string {
  const clean = value
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 7);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

const CORES_VEICULO = [
  { nome: 'Preto', hex: '#1a1a1a' },
  { nome: 'Branco', hex: '#e8e8e8' },
  { nome: 'Prata', hex: '#C0C0C0' },
  { nome: 'Cinza', hex: '#808080' },
  { nome: 'Azul', hex: '#1565C0' },
  { nome: 'Vermelho', hex: '#C62828' },
  { nome: 'Verde', hex: '#2E7D32' },
  { nome: 'Amarelo', hex: '#F9A825' },
  { nome: 'Laranja', hex: '#E65100' },
  { nome: 'Marrom', hex: '#6D4C41' },
  { nome: 'Bege', hex: '#D7CCC8' },
  { nome: 'Dourado', hex: '#B8860B' },
  { nome: 'Vinho', hex: '#880E4F' },
  { nome: 'Roxo', hex: '#6A1B9A' },
];

const NOMES_CORES = CORES_VEICULO.map((c) => c.nome);

// ─── Passo 4: Veículo ────────────────────────────────────────────
function StepVeiculo({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  const [corModal, setCorModal] = useState(false);
  const corAtual = data.cor || '';
  const isPredefinida = NOMES_CORES.includes(corAtual);

  const OPCOES_COR = [...CORES_VEICULO, { nome: 'Outra...', hex: '' }];

  return (
    <View>
      <Field label="Placa" error={erros.placa}>
        <Input
          value={data.placa || ''}
          onChange={(v) => up('placa', formatPlaca(v))}
          placeholder="ABC-1D23"
          maxLength={8}
          autoComplete="off"
          textContentType="none"
        />
      </Field>
      <Field label="Modelo" error={erros.modelo}>
        <Input
          value={data.modelo || ''}
          onChange={(v) => up('modelo', v)}
          placeholder="Ex: Honda CG 160"
          autoCapitalize="words"
        />
      </Field>

      <View style={s.field}>
        <Text style={s.fieldLabel}>COR</Text>
        <TouchableOpacity
          style={[s.bankSelector, !!erros.cor && { borderColor: '#E24B4A' }]}
          onPress={() => setCorModal(true)}
          activeOpacity={0.8}
        >
          {corAtual ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {isPredefinida && (
                <View
                  style={[
                    s.corDot,
                    {
                      backgroundColor:
                        CORES_VEICULO.find((c) => c.nome === corAtual)?.hex ?? '#ccc',
                    },
                  ]}
                />
              )}
              <Text style={s.bankSelectorValue}>{corAtual}</Text>
            </View>
          ) : (
            <Text style={s.bankSelectorPlaceholder}>Selecione a cor</Text>
          )}
          <Ionicons name="chevron-down" size={16} color="#9099B3" />
        </TouchableOpacity>

        {/* Modal de cores */}
        <Modal
          visible={corModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCorModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={s.bankModalHeader}>
              <TouchableOpacity onPress={() => setCorModal(false)} style={s.bankModalClose}>
                <Ionicons name="close" size={22} color="#000933" />
              </TouchableOpacity>
              <Text style={s.bankModalTitle}>Cor do veículo</Text>
            </View>
            <FlatList
              data={OPCOES_COR}
              keyExtractor={(item) => item.nome}
              renderItem={({ item }) => {
                const sel = corAtual === item.nome && item.nome !== 'Outra...';
                return (
                  <TouchableOpacity
                    style={[s.corModalItem, sel && s.corModalItemSel]}
                    onPress={() => {
                      if (item.nome === 'Outra...') {
                        up('cor', '');
                      } else {
                        up('cor', item.nome);
                      }
                      setCorModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    {item.hex ? (
                      <View
                        style={[
                          s.corDot,
                          { backgroundColor: item.hex, width: 22, height: 22, borderRadius: 11 },
                        ]}
                      />
                    ) : (
                      <Ionicons
                        name="pencil-outline"
                        size={20}
                        color={sel ? '#F2760F' : '#9099B3'}
                      />
                    )}
                    <Text style={[s.corModalText, sel && { color: '#F2760F', fontWeight: '700' }]}>
                      {item.nome}
                    </Text>
                    {sel && (
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color="#F2760F"
                        style={{ marginLeft: 'auto' as any }}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </SafeAreaView>
        </Modal>
        {!!erros.cor && <Text style={[s.fieldError, { marginTop: 4 }]}>{erros.cor}</Text>}
      </View>

      {/* Campo livre quando "Outra..." foi escolhida */}
      {!isPredefinida && (
        <View style={{ marginTop: -4, marginBottom: 12 }}>
          <Input
            value={corAtual}
            onChange={(v) => up('cor', v.replace(/[^a-zA-ZÀ-ÿ\s]/g, ''))}
            placeholder="Digite a cor do veículo..."
            autoCapitalize="words"
          />
        </View>
      )}

      <Field label="Ano" error={erros.ano}>
        <Input
          value={data.ano || ''}
          onChange={(v) => up('ano', v.replace(/\D/g, '').slice(0, 4))}
          placeholder="2022"
          keyboardType="numeric"
        />
      </Field>
    </View>
  );
}

// ─── Passo 5: Bancário ───────────────────────────────────────────
function StepBancario({ data, up, erros }: StepProps & { erros: Record<string, string> }) {
  const [bancoModal, setBancoModal] = useState(false);
  const [busca, setBusca] = useState('');

  const pixTipo = data.pixTipo || 'cpf';
  const tipoSel = PIX_TIPOS.find((t) => t.id === pixTipo) ?? PIX_TIPOS[0];

  const handlePixChange = (v: string) => {
    if (pixTipo === 'cpf') up('pix', formatCPF(v));
    else if (pixTipo === 'celular') up('pix', formatTel(v));
    else up('pix', v);
  };

  const bancosFiltrados = BANCOS.filter(
    (b) => b.nome.toLowerCase().includes(busca.toLowerCase()) || b.codigo.includes(busca),
  );

  const bancoSelecionado = BANCOS.find((b) => data.banco === `${b.codigo} - ${b.nome}`);

  return (
    <View>
      <View style={s.pixHint}>
        <Ionicons name="flash" size={18} color="#046C2E" />
        <View>
          <Text style={s.pixHintTitle}>Prefira Pix</Text>
          <Text style={s.pixHintSub}>Saque instantâneo, sem taxa</Text>
        </View>
      </View>

      {/* Seletor de tipo de chave */}
      <Text style={[s.fieldLabel, { marginBottom: 8 }]}>Tipo de chave Pix</Text>
      <View style={s.pixTipos}>
        {PIX_TIPOS.map((t) => {
          const ativo = pixTipo === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[s.pixTipoBtn, ativo && s.pixTipoBtnActive]}
              onPress={() => {
                up('pixTipo', t.id);
                up('pix', '');
              }}
              activeOpacity={0.8}
            >
              <Text style={[s.pixTipoText, ativo && s.pixTipoTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Field label="Chave Pix" error={erros.pix}>
        <Input
          value={data.pix || ''}
          onChange={handlePixChange}
          placeholder={tipoSel.placeholder}
          keyboardType={tipoSel.keyboard}
        />
      </Field>

      <Text style={s.orLabel}>Ou conta bancária</Text>

      <Field label="Banco">
        <TouchableOpacity
          style={s.bankSelector}
          onPress={() => setBancoModal(true)}
          activeOpacity={0.8}
        >
          {bancoSelecionado ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={s.bankCodigoBadge}>
                <Text style={s.bankCodigoBadgeText}>{bancoSelecionado.codigo}</Text>
              </View>
              <Text style={s.bankSelectorValue}>{bancoSelecionado.nome}</Text>
            </View>
          ) : (
            <Text style={s.bankSelectorPlaceholder}>Selecione um banco</Text>
          )}
          <Ionicons name="chevron-down" size={16} color="#9099B3" />
        </TouchableOpacity>
      </Field>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Field label="Agência">
            <Input
              value={data.agencia || ''}
              onChange={(v) => up('agencia', v)}
              placeholder="0000"
              keyboardType="numeric"
            />
          </Field>
        </View>
        <View style={{ flex: 1 }}>
          <Field label="Conta" error={erros.conta}>
            <Input
              value={data.conta || ''}
              onChange={(v) => up('conta', v)}
              placeholder="000000-0"
            />
          </Field>
        </View>
      </View>

      {/* Modal de bancos */}
      <Modal visible={bancoModal} animationType="slide" onRequestClose={() => setBancoModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <View style={s.bankModalHeader}>
            <TouchableOpacity
              onPress={() => {
                setBancoModal(false);
                setBusca('');
              }}
              style={s.bankModalClose}
            >
              <Ionicons name="close" size={22} color="#000933" />
            </TouchableOpacity>
            <Text style={s.bankModalTitle}>Selecionar banco</Text>
          </View>
          <View style={s.bankSearchBox}>
            <Ionicons name="search" size={16} color="#9099B3" />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome ou código..."
              placeholderTextColor="#9099B3"
              style={s.bankSearchInput}
              autoFocus
            />
            {busca.length > 0 && (
              <TouchableOpacity onPress={() => setBusca('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color="#9099B3" />
              </TouchableOpacity>
            )}
          </View>
          <FlatList
            data={bancosFiltrados}
            keyExtractor={(item) => item.codigo}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selecionado = data.banco === `${item.codigo} - ${item.nome}`;
              return (
                <TouchableOpacity
                  style={[s.bankItem, selecionado && s.bankItemActive]}
                  onPress={() => {
                    up('banco', `${item.codigo} - ${item.nome}`);
                    setBancoModal(false);
                    setBusca('');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={s.bankCodigoBadge}>
                    <Text style={s.bankCodigoBadgeText}>{item.codigo}</Text>
                  </View>
                  <Text
                    style={[s.bankItemNome, selecionado && { color: '#F2760F', fontWeight: '700' }]}
                  >
                    {item.nome}
                  </Text>
                  {selecionado && <Ionicons name="checkmark-circle" size={20} color="#F2760F" />}
                </TouchableOpacity>
              );
            }}
            ItemSeparatorComponent={() => (
              <View style={{ height: 1, backgroundColor: '#F0F1F5', marginLeft: 66 }} />
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Passo 6: Revisão ────────────────────────────────────────────
function StepRevisao({ data }: { data: Data }) {
  const t = TRANSPORTES.find((t) => t.id === data.transporte);
  const rows = [
    { label: 'Nome', value: data.nome || '—' },
    { label: 'CPF', value: data.cpf || '—' },
    { label: 'Email', value: data.email || '—' },
    { label: 'Celular', value: data.celular || '—' },
    { label: 'Transporte', value: t?.label || '—' },
    { label: 'Chave Pix', value: data.pix || '—' },
  ];
  return (
    <View>
      <View style={s.reviewHero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={s.reviewTitle}>Tudo pronto!</Text>
          <Ionicons name="happy" size={22} color="#FFFFFF" />
        </View>
        <Text style={s.reviewSub}>Vamos revisar seu cadastro antes de enviar.</Text>
      </View>
      {rows.map((r) => (
        <View key={r.label} style={s.reviewRow}>
          <Text style={s.reviewLabel}>{r.label}</Text>
          <Text style={s.reviewValue}>{r.value}</Text>
        </View>
      ))}
      <View style={s.tipBox}>
        <Ionicons name="flash" size={16} color="#F2760F" />
        <Text style={s.tipText}>
          <Text style={{ fontWeight: '700' }}>Dica:</Text> entregadores que começam já na primeira
          semana ganham bônus de R$ 100.
        </Text>
      </View>
    </View>
  );
}

// ─── Validação do passo 1 ─────────────────────────────────────────
function validarPasso1(data: Data): Record<string, string> {
  const e: Record<string, string> = {};
  const nomeParts = (data.nome || '').trim().split(/\s+/);
  if (nomeParts.length < 2 || nomeParts[1].length < 2) e.nome = 'Informe seu nome e sobrenome.';
  const cpfDigits = (data.cpf || '').replace(/\D/g, '');
  if (cpfDigits.length < 11) e.cpf = 'CPF incompleto — informe os 11 dígitos.';
  else if (!validateCPF(data.cpf || '')) e.cpf = 'CPF inválido. Verifique os números digitados.';
  if ((data.celularCompleto || data.celular || '').replace(/\D/g, '').length < 10)
    e.celular = 'Celular inválido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((data.email || '').trim())) e.email = 'Email inválido.';
  if ((data.senha || '').length < 6) e.senha = 'Mínimo 6 caracteres.';
  if (!(data.confirmarSenha || '')) e.confirmarSenha = 'Confirme sua senha.';
  else if ((data.senha || '') !== (data.confirmarSenha || ''))
    e.confirmarSenha = 'As senhas não coincidem.';
  return e;
}

// ─── Tela principal ───────────────────────────────────────────────
interface OnboardingScreenProps {
  onDone: (result: 'submitted' | 'cancel') => void;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const registrar = useAuthEntregadorStore((s) => s.registrar);
  const setFotoUrl = useAuthEntregadorStore((s) => s.setFotoUrl);

  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [frenteUri, setFrenteUri] = useState<string | null>(null);
  const [versoUri, setVersoUri] = useState<string | null>(null);
  const [docModal, setDocModal] = useState<'frente' | 'verso' | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  const checkDisponivel = useCallback(
    async (field: 'cpf' | 'email' | 'telefone', value: string) => {
      try {
        const res = await fetch(
          `${LAPI}/auth/entregador/check?field=${field}&value=${encodeURIComponent(value)}`,
        );
        if (!res.ok) return;
        const { available } = await res.json();
        if (!available) {
          const msgs: Record<string, string> = {
            cpf: 'Este CPF já possui uma conta. Faça login ou use outro CPF.',
            email: 'Este e-mail já está em uso. Faça login ou use outro e-mail.',
            telefone: 'Este celular já está cadastrado. Faça login ou use outro número.',
          };
          setErros((prev) => ({
            ...prev,
            [field === 'telefone' ? 'celular' : field]: msgs[field],
          }));
        }
      } catch {
        // falha silenciosa
      }
    },
    [],
  );

  const onBlurCpf = useCallback(async () => {
    const digits = (data.cpf || '').replace(/\D/g, '');
    if (digits.length < 11 || !validateCPF(data.cpf || '')) return;
    await checkDisponivel('cpf', digits);
  }, [data.cpf, checkDisponivel]);

  const onBlurEmail = useCallback(async () => {
    const trimmed = (data.email || '').trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) return;
    await checkDisponivel('email', trimmed);
  }, [data.email, checkDisponivel]);

  const pickDoc = (lado: 'frente' | 'verso') => setDocModal(lado);

  const launchCamera = async () => {
    const lado = docModal;
    setDocModal(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à câmera nas configurações.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      if (lado === 'frente') setFrenteUri(result.assets[0].uri);
      else if (lado === 'verso') setVersoUri(result.assets[0].uri);
    }
  };

  const launchGallery = async () => {
    const lado = docModal;
    setDocModal(null);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria nas configurações.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (lado === 'frente') setFrenteUri(result.assets[0].uri);
      else if (lado === 'verso') setVersoUri(result.assets[0].uri);
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setErros((e) => {
        const n = { ...e };
        delete n.foto;
        return n;
      });
    }
  };

  const geocodeCoords = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`${LAPI}/geocode/by-coords?lat=${lat}&lng=${lng}`);
      if (!res.ok) return;
      const geoData = await res.json();
      setData((d) => ({
        ...d,
        cep: (geoData.cep ?? d.cep ?? '').replace(/\D/g, ''),
        rua: geoData.rua || d.rua || '',
        bairro: geoData.bairro || d.bairro || '',
      }));
    } catch {
      // geocode falhou silenciosamente — usuário pode preencher manualmente
    }
  }, []);

  const usarLocalizacao = async () => {
    setLocLoading(true);
    setErros((e) => ({ ...e, localizacao: '' }));
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
          setErros((e) => ({ ...e, localizacao: msg }));
          return;
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setErros((e) => ({ ...e, localizacao: 'Permissão de localização negada.' }));
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      setGpsCoords({ lat, lng });
      await geocodeCoords(lat, lng);
    } finally {
      setLocLoading(false);
    }
  };

  const handlePinMoved = useCallback(
    async (lat: number, lng: number) => {
      setGpsCoords({ lat, lng });
      await geocodeCoords(lat, lng);
    },
    [geocodeCoords],
  );

  const up = (k: string, v: string) => {
    setData((d) => ({ ...d, [k]: v }));
    setErros((e) => {
      if (!e[k]) return e;
      const next = { ...e };
      delete next[k];
      return next;
    });
  };
  const needsVehicle = data.transporte !== 'bike';

  // Transporte vem antes de Documentos para que o label CNH/RG seja correto
  const steps = [
    { title: 'Dados pessoais' },
    { title: 'Transporte' },
    ...(needsVehicle ? [{ title: 'Veículo' }] : []),
    { title: 'Documentos' },
    { title: 'Bancário' },
    { title: 'Revisão' },
  ];

  const isLast = step === steps.length - 1;
  const cur = steps[step];

  const next = async () => {
    // Valida campos obrigatórios
    if (step === 0) {
      const e = validarPasso1(data);
      if (!photoUri) e.foto = 'Adicione uma foto de perfil para continuar.';
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    if (cur.title === 'Transporte') {
      if (!data.transporte) {
        setErros({ transporte: 'Selecione seu meio de transporte para continuar.' });
        return;
      }
      setErros({});
    }

    if (cur.title === 'Veículo') {
      const e: Record<string, string> = {};
      const placaClean = (data.placa || '').replace(/[^a-zA-Z0-9]/g, '');
      if (!placaClean) {
        e.placa = 'Informe a placa do veículo.';
      } else if (placaClean.length < 7) {
        e.placa = 'Placa incompleta — formato: ABC-1234 ou ABC-1D23.';
      }
      if (!data.modelo?.trim()) e.modelo = 'Informe o modelo do veículo.';
      if (!data.cor?.trim()) {
        e.cor = 'Informe a cor do veículo.';
      }
      if (!data.ano?.trim()) {
        e.ano = 'Informe o ano do veículo.';
      } else {
        const ano = parseInt(data.ano, 10);
        const anoAtual = new Date().getFullYear();
        if (isNaN(ano) || ano < 1990 || ano > anoAtual) {
          e.ano = `Informe um ano válido entre 1990 e ${anoAtual}.`;
        }
      }
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    if (cur.title === 'Bancário') {
      const hasPix = !!data.pix?.trim();
      const hasBanco = !!data.banco;
      const hasAgenciaConta = !!data.agencia?.trim() && !!data.conta?.trim();
      const e: Record<string, string> = {};
      if (!hasPix && !hasBanco) {
        e.pix = 'Informe sua chave Pix ou selecione um banco para continuar.';
      } else if (hasBanco && !hasAgenciaConta) {
        e.conta = 'Informe a agência e a conta do banco selecionado.';
      }
      if (Object.keys(e).length > 0) {
        setErros(e);
        return;
      }
      setErros({});
    }

    // Valida documentos obrigatórios
    if (cur.title === 'Documentos') {
      if (!frenteUri) {
        Alert.alert(
          'Documento obrigatório',
          `Tire uma foto da frente do seu ${data.transporte === 'bike' ? 'RG' : 'CNH'}.`,
        );
        return;
      }
      if (!versoUri) {
        Alert.alert(
          'Documento obrigatório',
          `Tire uma foto do verso do seu ${data.transporte === 'bike' ? 'RG' : 'CNH'}.`,
        );
        return;
      }
    }

    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }

    // Último passo: envia cadastro real
    setLoading(true);
    setSubmitError('');
    console.log(
      '[Entregador][Onboarding] Enviando cadastro — nome:',
      data.nome,
      '| cpf:',
      data.cpf,
      '| email:',
      data.email,
      '| transporte:',
      data.transporte,
    );
    try {
      const celFull = (data.celularCompleto || data.celular || '').replace(/[^\d+]/g, '');
      console.log('[Entregador][Onboarding] Registrando conta...');
      await registrar({
        nome: data.nome,
        cpf: (data.cpf || '').replace(/\D/g, ''),
        telefone: celFull || `+55${(data.celular || '').replace(/\D/g, '')}`,
        email: data.email,
        senha: data.senha,
        tipoTransporte: (data.transporte || 'moto') as 'bike' | 'moto' | 'carro',
      });
      const currentToken = useAuthEntregadorStore.getState().token;
      console.log(
        '[Entregador][Onboarding] Conta criada — token:',
        currentToken ? 'presente' : 'ausente',
      );

      // Salvar veículo
      if (currentToken) {
        if (data.transporte === 'bike') {
          console.log('[Entregador][Onboarding] Cadastrando veículo (bicicleta)...');
          await EntregadorService.cadastrarVeiculo(currentToken, {
            placa: 'BICICLETA',
            modelo: 'Bicicleta',
            cor: (data.cor || 'Não informado').trim(),
            ano: parseInt(data.ano) || new Date().getFullYear(),
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao cadastrar veículo:', err),
          );
        } else if (data.placa && data.modelo) {
          console.log('[Entregador][Onboarding] Cadastrando veículo:', data.modelo, data.placa);
          await EntregadorService.cadastrarVeiculo(currentToken, {
            placa: data.placa.trim(),
            modelo: data.modelo.trim(),
            cor: (data.cor || 'Não informado').trim(),
            ano: parseInt(data.ano) || new Date().getFullYear(),
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao cadastrar veículo:', err),
          );
        }
      }

      // Salvar localização do entregador se capturada
      if (currentToken && gpsCoords) {
        fetch(`${LAPI}/entregador/localizacao`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${currentToken}` },
          body: JSON.stringify({ lat: gpsCoords.lat, lng: gpsCoords.lng }),
        }).catch(() => {});
      }

      // Salvar dados bancários
      if (currentToken && (data.pix || data.banco)) {
        const hasPix = !!data.pix;
        const temConta = !hasPix && !!data.banco && !!data.agencia && !!data.conta;
        if (hasPix) {
          console.log('[Entregador][Onboarding] Salvando chave Pix:', data.pixTipo, data.pix);
          await EntregadorService.atualizarDadosBancarios(currentToken, {
            tipo: 'pix',
            chavePix: data.pix,
          }).catch((err) => console.warn('[Entregador][Onboarding] Falha ao salvar Pix:', err));
        } else if (temConta) {
          console.log('[Entregador][Onboarding] Salvando conta bancária — banco:', data.banco);
          await EntregadorService.atualizarDadosBancarios(currentToken, {
            tipo: 'conta',
            banco: data.banco,
            agencia: data.agencia,
            conta: data.conta,
          }).catch((err) =>
            console.warn('[Entregador][Onboarding] Falha ao salvar conta bancária:', err),
          );
        }
      }

      // Upload dos documentos de identidade
      if (currentToken && frenteUri && versoUri) {
        console.log('[Entregador][Onboarding] Enviando documentos de identidade...');
        await EntregadorService.uploadDocumentosIdentidade(currentToken, frenteUri, versoUri).catch(
          (err) => console.warn('[Entregador][Onboarding] Falha ao enviar documentos:', err),
        );
      }

      // Upload da foto de perfil após o registro (token já disponível no store)
      if (photoUri && currentToken) {
        console.log('[Entregador][Onboarding] Enviando foto de perfil...');
        const url = await EntregadorService.atualizarFoto(currentToken, photoUri);
        await setFotoUrl(url);
      }

      console.log('[Entregador][Onboarding] Cadastro concluído com sucesso');
      onDone('submitted');
    } catch (e: any) {
      console.error('[Entregador][Onboarding] Erro no cadastro:', e);
      const isNetwork =
        e?.message &&
        (e.message.includes('Network') ||
          e.message.includes('fetch') ||
          e.message.includes('Failed'));
      const msg = enrichRateLimit(
        isNetwork
          ? 'Sem conexão com o servidor. Verifique sua internet.'
          : (e?.message ?? 'Erro ao cadastrar. Tente novamente.'),
      );
      const field = e?.field as string | undefined;
      if (field) {
        setErros((prev) => ({ ...prev, [field === 'telefone' ? 'celular' : field]: msg }));
        setStep(0);
      } else {
        setSubmitError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const prev = () => {
    if (step === 0) onDone('cancel');
    else setStep((s) => s - 1);
  };

  return (
    <SafeAreaView style={s.safeArea}>
      {/* Cabeçalho */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <TouchableOpacity style={s.backBtn} onPress={prev} activeOpacity={0.8}>
            <Ionicons name="chevron-back" size={18} color="#000933" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={s.headerStep}>
              Passo {step + 1} de {steps.length}
            </Text>
            <Text style={s.headerTitle}>{cur.title}</Text>
          </View>
        </View>
        <View style={s.progressBars}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[s.progressBar, { backgroundColor: i <= step ? '#F2760F' : '#E4E7F1' }]}
            />
          ))}
        </View>
      </View>

      {/* Conteúdo */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {cur.title === 'Dados pessoais' && (
          <StepPessoal
            data={data}
            up={up}
            erros={erros}
            photoUri={photoUri}
            onPickPhoto={pickPhoto}
            onGps={usarLocalizacao}
            locLoading={locLoading}
            gpsCoords={gpsCoords}
            onPinMoved={handlePinMoved}
            onClearGps={() => {
              setGpsCoords(null);
              setData((d) => ({ ...d, cep: '', rua: '', bairro: '' }));
              setErros((e) => ({ ...e, localizacao: '' }));
            }}
            onBlurCpf={onBlurCpf}
            onBlurEmail={onBlurEmail}
          />
        )}
        {cur.title === 'Documentos' && (
          <StepDocs
            frenteUri={frenteUri}
            versoUri={versoUri}
            onPickDoc={pickDoc}
            tipoTransporte={data.transporte || 'moto'}
          />
        )}
        {cur.title === 'Transporte' && <StepTransporte data={data} up={up} erros={erros} />}
        {cur.title === 'Veículo' && <StepVeiculo data={data} up={up} erros={erros} />}
        {cur.title === 'Bancário' && <StepBancario data={data} up={up} erros={erros} />}
        {cur.title === 'Revisão' && <StepRevisao data={data} />}
      </ScrollView>

      {/* Rodapé */}
      <View style={s.footer}>
        {submitError ? <Text style={s.submitError}>{submitError}</Text> : null}
        <TouchableOpacity
          style={[s.ctaBtn, loading && { opacity: 0.7 }]}
          onPress={next}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={s.ctaBtnText}>{isLast ? 'Enviar cadastro' : 'Continuar'}</Text>
              {!isLast && <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />}
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal seleção de foto de documento */}
      <Modal
        visible={docModal !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setDocModal(null)}
      >
        <TouchableOpacity
          style={s.modalBackdrop}
          activeOpacity={1}
          onPress={() => setDocModal(null)}
        >
          <View style={s.modalSheet}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>
              {docModal === 'frente' ? 'Frente do documento' : 'Verso do documento'}
            </Text>
            <Text style={s.modalSub}>Escolha como deseja enviar a foto</Text>

            <TouchableOpacity style={s.modalOption} activeOpacity={0.8} onPress={launchCamera}>
              <View style={s.modalOptionIcon}>
                <Ionicons name="camera" size={24} color="#F2760F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalOptionTitle}>Tirar foto</Text>
                <Text style={s.modalOptionSub}>Abrir câmera do celular</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9099B3" />
            </TouchableOpacity>

            <TouchableOpacity style={s.modalOption} activeOpacity={0.8} onPress={launchGallery}>
              <View style={s.modalOptionIcon}>
                <Ionicons name="images" size={24} color="#F2760F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.modalOptionTitle}>Escolher da galeria</Text>
                <Text style={s.modalOptionSub}>Selecionar foto existente</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9099B3" />
            </TouchableOpacity>

            <TouchableOpacity
              style={s.modalCancel}
              onPress={() => setDocModal(null)}
              activeOpacity={0.8}
            >
              <Text style={s.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────
const s = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { padding: 16, paddingBottom: 0, borderBottomWidth: 1, borderBottomColor: '#E4E7F1' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerStep: {
    fontSize: 11,
    color: '#9099B3',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000933', letterSpacing: -0.3 },
  progressBars: { flexDirection: 'row', gap: 4, paddingBottom: 14 },
  progressBar: { flex: 1, height: 4, borderRadius: 99 },

  scroll: { flex: 1 },
  content: { padding: 22, paddingBottom: 20 },

  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
  },
  submitError: {
    fontSize: 12,
    color: '#E24B4A',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '500',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F2760F',
    borderRadius: 14,
    paddingVertical: 16,
  },
  ctaBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },

  field: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#2A3156', marginBottom: 6 },
  fieldError: { fontSize: 11, color: '#E24B4A', marginTop: 4, fontWeight: '500' },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  inputInner: { flex: 1, fontSize: 15, color: '#000933' },
  inputFocused: { borderColor: '#F2760F' },
  eyeBtn: { paddingLeft: 8 },

  photoBtn: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#F2760F',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    backgroundColor: '#FEF0E3',
    marginBottom: 20,
    gap: 4,
  },
  photoBtnText: { fontSize: 11, color: '#F2760F', fontWeight: '600' },
  photoBtnError: { borderColor: '#E24B4A', backgroundColor: 'rgba(226,75,74,0.06)' },
  photoHint: {
    fontSize: 11,
    color: '#9099B3',
    textAlign: 'center',
    marginTop: -12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  stepDesc: { fontSize: 13, color: '#9099B3', lineHeight: 19, marginBottom: 18 },

  docBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E4E7F1',
    borderStyle: 'dashed',
    backgroundColor: '#F6F7FB',
    marginBottom: 10,
  },
  docIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumb: { width: 42, height: 42, borderRadius: 10 },
  docTitle: { fontSize: 14, fontWeight: '600', color: '#000933' },
  docSub: { fontSize: 11, color: '#9099B3', marginTop: 2 },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(32,156,239,0.08)',
    borderRadius: 10,
    marginTop: 8,
  },
  infoText: { flex: 1, fontSize: 12, color: '#000933', lineHeight: 18 },

  transporteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#FFFFFF',
    marginBottom: 10,
  },
  transporteBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.05)' },
  transporteIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  transporteLabel: { fontSize: 15, fontWeight: '600', color: '#000933', marginBottom: 2 },
  transporteDesc: { fontSize: 11.5, color: '#9099B3' },

  pixHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: 'rgba(57,255,137,0.15)',
    borderRadius: 12,
    marginBottom: 18,
  },
  pixHintTitle: { fontSize: 13, fontWeight: '700', color: '#046C2E' },
  pixHintSub: { fontSize: 11, color: '#046C2E', opacity: 0.85 },
  orLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 10,
    marginTop: 6,
  },

  pixTipos: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  pixTipoBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  pixTipoBtnActive: { borderColor: '#F2760F', backgroundColor: 'rgba(242,118,15,0.08)' },
  pixTipoText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  pixTipoTextActive: { color: '#F2760F' },

  bankSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  bankSelectorValue: { flex: 1, fontSize: 15, color: '#000933', fontWeight: '500' },
  bankSelectorPlaceholder: { flex: 1, fontSize: 15, color: '#9099B3' },
  bankCodigoBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#E4E7F1',
  },
  bankCodigoBadgeText: { fontSize: 11, fontWeight: '700', color: '#2A3156' },

  bankModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  bankModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F7FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bankModalTitle: { fontSize: 17, fontWeight: '700', color: '#000933' },
  bankSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    margin: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
  },
  bankSearchInput: { flex: 1, fontSize: 15, color: '#000933' },
  bankItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bankItemActive: { backgroundColor: 'rgba(242,118,15,0.05)' },
  bankItemNome: { flex: 1, fontSize: 14, color: '#000933', fontWeight: '500' },

  reviewHero: { padding: 18, borderRadius: 16, backgroundColor: '#000933', marginBottom: 14 },
  reviewTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.4 },
  reviewSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, lineHeight: 18 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  reviewLabel: { fontSize: 13, color: '#9099B3' },
  reviewValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000933',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },

  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#FEF0E3',
    borderRadius: 12,
    marginTop: 14,
  },
  tipText: { flex: 1, fontSize: 12, color: '#F2760F', lineHeight: 18 },

  gpsSection: { marginTop: 6, marginBottom: 4 },
  gpsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  corDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  corModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7F1',
  },
  corModalItemSel: { backgroundColor: 'rgba(242,118,15,0.06)' },
  corModalText: { fontSize: 15, color: '#000933' },
  gpsSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9099B3',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gpsSectionOpcional: { fontSize: 11, color: '#B0B8CC', fontStyle: 'italic' },
  gpsBtnRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#F2760F',
    backgroundColor: '#FEF0E3',
  },
  gpsBtnDone: { borderColor: '#039855', backgroundColor: 'rgba(3,152,85,0.07)' },
  gpsBtnText: { fontSize: 13, fontWeight: '600', color: '#F2760F' },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
  },
  clearBtnText: { fontSize: 13, fontWeight: '600', color: '#9099B3' },
  mapBox: { height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 10 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 99,
    backgroundColor: '#E4E7F1',
    alignSelf: 'center',
    marginBottom: 18,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#000933', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#9099B3', marginBottom: 20 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E7F1',
    backgroundColor: '#F6F7FB',
    marginBottom: 10,
  },
  modalOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FEF0E3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionTitle: { fontSize: 15, fontWeight: '600', color: '#000933' },
  modalOptionSub: { fontSize: 12, color: '#9099B3', marginTop: 2 },
  modalCancel: {
    marginTop: 6,
    padding: 14,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E7F1',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: '#9099B3' },
});
