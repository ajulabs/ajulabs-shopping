import { Platform } from 'react-native';

/**
 * Canal Android customizado para o alerta de nova corrida.
 *
 * Configurado pra:
 * - Tocar som custom (corrida_alert.mp3) em volume alto
 * - Vibrar com padrão longo
 * - Ignorar modo silencioso usando AudioAttributes USAGE_ALARM
 * - Permitir full-screen intent (acordar a tela mesmo bloqueado)
 *
 * O backend deve enviar pushes de corrida com `channelId: 'ride-alerts'`
 * para usar este canal. Pushes em outras categorias usam o canal default.
 *
 * iOS NÃO usa channels (são exclusivos do Android). Para iOS, o critical
 * alert depende do entitlement `com.apple.developer.usernotifications.critical-alerts`
 * que precisa ser solicitado à Apple. Sem isso, o som é o padrão do sistema.
 */
export const RIDE_ALERT_CHANNEL_ID = 'ride-alerts';

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // expo-notifications é native-only, lazy require pra não quebrar web
  const Notifications = require('expo-notifications');

  await Notifications.setNotificationChannelAsync(RIDE_ALERT_CHANNEL_ID, {
    name: 'Alerta de corrida',
    description: 'Som alto para alertar sobre novas corridas disponíveis. Ignora modo silencioso.',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'corrida_alert.mp3', // referencia o arquivo declarado em app.json
    vibrationPattern: [0, 400, 200, 400, 200, 400],
    lightColor: '#FF6B00',
    enableLights: true,
    enableVibrate: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    bypassDnd: true, // ignora modo "não perturbe"
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
      flags: {
        enforceAudibility: true,
        requestHardwareAudioVideoSynchronization: false,
      },
    },
  });
}
