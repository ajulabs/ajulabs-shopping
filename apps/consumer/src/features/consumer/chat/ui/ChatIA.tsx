import { useState, useRef, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@ajulabs/theme';
import { useTheme } from '../../../../shared/hooks';
import { ChatMsg } from './ChatMsg';
import { ChatInput } from './ChatInput';
import { QuickActions } from './components/QuickActions';
import { WelcomeOverlay } from './components/WelcomeOverlay';
import { HelpModal } from './components/HelpModal';
import { TranscricaoPreview } from './components/TranscricaoPreview';
import { useChatAju, storage, ONBOARDING_KEY } from '../model/useChatAju';
import { useTranscricao } from '../model/useTranscricao';
import { getDesambiguacao } from '../lib/desambiguacao';

export function ChatIA() {
  const { mensagens, sugestoes, carregando, enviarMensagem, limparConversa } = useChatAju();

  const [inputValue, setInputValue] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [textoTranscrito, setTextoTranscrito] = useState<string | null>(null);
  const welcomeOpacity = useRef(new Animated.Value(0)).current;

  const { isDark, bg, surf, borderL, text, textSec } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { gravando, transcrevendo, toggleGravacao } = useTranscricao();

  useEffect(() => {
    storage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) {
        setShowWelcome(true);
        Animated.timing(welcomeOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    });
  }, []);

  function dismissWelcome() {
    Animated.timing(welcomeOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(
      () => {
        setShowWelcome(false);
        storage.setItem(ONBOARDING_KEY, '1').catch(() => {});
      },
    );
  }

  function handleEnviar() {
    const texto = inputValue.trim();
    if (!texto) return;
    setInputValue('');
    enviarMensagem(texto);
  }

  const desambiguacao = getDesambiguacao(inputValue, carregando);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top + 12,
            paddingBottom: 16,
            backgroundColor: surf,
            borderBottomWidth: 1,
            borderBottomColor: borderL,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#f97316',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>A</Text>
            </View>
            <View>
              <Text style={{ fontWeight: '600', fontSize: 15, color: text }}>
                Aju · Personal Shopper
              </Text>
              <Text style={{ fontSize: 12, color: '#22c55e' }}>● Online agora</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={limparConversa}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.n100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash-outline" size={17} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowHelp(true)}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.n100,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 15, color: textSec as string, fontWeight: '700' }}>?</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(consumer)/carrinho')}>
              <Ionicons name="cart-outline" size={22} color={text} />
            </TouchableOpacity>
          </View>
        </View>

        <ChatMsg
          mensagens={mensagens}
          sugestoes={sugestoes}
          onSugestao={(texto, pedidoId) => {
            if (texto === 'Ver meus tickets') {
              router.push('/(consumer)/tickets' as any);
              return;
            }
            if (texto === 'Ver meus pedidos') {
              router.push('/(consumer)/pedidos' as any);
              return;
            }
            enviarMensagem(texto, pedidoId);
          }}
          carregando={carregando}
        />

        <QuickActions
          disabled={carregando}
          onAction={(msg) => {
            setInputValue('');
            enviarMensagem(msg);
          }}
        />

        {desambiguacao.length > 0 && (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 8,
              backgroundColor: bg,
            }}
          >
            {desambiguacao.map((d) => (
              <TouchableOpacity
                key={d.msg}
                onPress={() => {
                  setInputValue('');
                  enviarMensagem(d.msg);
                }}
                activeOpacity={0.75}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: isDark ? 'rgba(249,115,22,0.15)' : '#fff7ed',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(249,115,22,0.35)' : '#fed7aa',
                  borderRadius: 20,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    fontSize: 12.5,
                    fontWeight: '600',
                    color: isDark ? '#fb923c' : '#c2410c',
                  }}
                >
                  {d.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Preview de confirmação do texto transcrito por voz */}
        {textoTranscrito && (
          <TranscricaoPreview
            texto={textoTranscrito}
            onEnviar={() => {
              enviarMensagem(textoTranscrito);
              setTextoTranscrito(null);
            }}
            onEditar={() => {
              setInputValue(textoTranscrito);
              setTextoTranscrito(null);
            }}
            onDescartar={() => setTextoTranscrito(null)}
          />
        )}

        <ChatInput
          value={inputValue}
          onChangeValue={setInputValue}
          onSend={handleEnviar}
          onMicPress={() => toggleGravacao((texto) => setTextoTranscrito(texto))}
          gravando={gravando}
          transcrevendo={transcrevendo}
          disabled={carregando}
        />

        <Text
          style={{
            textAlign: 'center',
            fontSize: 11,
            color: textSec,
            paddingTop: 8,
            paddingBottom: 12,
            backgroundColor: bg,
          }}
        >
          IA com <Text style={{ color: '#f97316', fontWeight: '500' }}>lojas reais</Text> de Aracaju
        </Text>
      </View>

      {showWelcome && <WelcomeOverlay opacity={welcomeOpacity} onDismiss={dismissWelcome} />}

      <HelpModal visible={showHelp} onClose={() => setShowHelp(false)} />
    </KeyboardAvoidingView>
  );
}
