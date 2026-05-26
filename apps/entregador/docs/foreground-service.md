# Foreground service + alerta de corrida (modo iFood/Uber)

Este PR adiciona ao app do entregador o comportamento clássico de apps de delivery: quando o entregador clica "online", o app mantém um foreground service de localização rodando, envia heartbeat pro backend a cada minuto, e dispara um alerta agressivo (som alto, tela cheia) quando uma nova corrida fica disponível.

## Itens manuais ANTES do EAS build

### 1. Adicionar o som de alerta

Coloque um arquivo MP3 (1-3 segundos, volume alto, alarmante) em:

```
apps/entregador/assets/corrida-alert.mp3
```

Esse arquivo está referenciado no `app.json` no plugin `expo-notifications`. **Sem ele o build vai falhar.** Sugestões:

- mixkit.co (livre de direitos, baixa em MP3)
- freesound.org
- Qualquer .mp3 curto que você tenha

### 2. (Opcional, iOS) Solicitar critical alerts à Apple

Para que o som toque mesmo em modo silencioso no iPhone, é preciso o entitlement `com.apple.developer.usernotifications.critical-alerts`. Solicite à Apple em developer.apple.com → Contact → Critical Alerts. Sem isso, o iOS usa o som padrão.

### 3. EAS Build

Após o som estar no lugar:

```bash
cd apps/entregador
eas build --platform android --profile preview
```

## Migration SQL (banco)

Antes de rodar o backend com este código, aplique no Supabase SQL Editor:

```sql
ALTER TABLE entregadores
  ADD COLUMN IF NOT EXISTS ultima_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ultima_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS ultimo_heartbeat TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_entregadores_online_geo
  ON entregadores (ultima_lat, ultima_lng)
  WHERE online = true AND ultima_lat IS NOT NULL AND ultima_lng IS NOT NULL;
```

O SQL completo está em `backend/prisma/entregador_heartbeat.sql`.

Após aplicar, no terminal:

```bash
cd backend
pnpm prisma generate
```

## Como funciona

### Modo idle (online sem corrida)

- Entregador clica "Online" na HomeScreen → `startIdleTracking(token, apiUrl)`
- Foreground service do Android é iniciado (notificação persistente "Online — aguardando corridas")
- A cada ~1 min, posição GPS é enviada via `POST /v1/entregador/heartbeat`
- Backend atualiza `ultimaLat`/`ultimaLng`/`ultimoHeartbeat` no Entregador
- (Futuro) Backend pode usar essas coords pra ofertar corridas apenas pra entregadores próximos

### Alerta de corrida nova

- Backend chama `notificarCorridaOferta` → envia push com `channelId: 'ride-alerts'`, `priority: 'high'`
- App recebe push no canal `ride-alerts` (configurado em `notificationChannels.ts`):
  - Importância MAX
  - Som custom `corrida-alert.mp3`
  - `AudioAttributes.USAGE_ALARM` → ignora modo silencioso
  - Vibração longa
  - Full-screen intent → tela acende mesmo bloqueada
- Ao tocar na notificação → `router.push('/nova-corrida/[pedidoId]')`
- Tela full-screen com countdown 15s, botões Aceitar/Recusar grandes
- Aceitar → chama `EntregadorService.aceitarCorrida` → redireciona pra Home

### Transição idle → corrida ativa

Quando o entregador aceita uma corrida, a `ActiveScreen` automaticamente:
1. Para o `IDLE_LOCATION_TASK` (leve, 1 min)
2. Inicia o `BACKGROUND_LOCATION_TASK` (pesado, 5s, via socket)

Os dois tasks NÃO rodam simultaneamente.

## iOS

Funcionalidade Android-first. iOS funciona, mas com limitações:

- **Sem critical alerts**: som padrão do sistema (sem ignorar silencioso) até a Apple aprovar o entitlement
- **Sem full-screen intent**: iOS não permite. Notificação aparece normal, tocar abre a tela
- **Background fetch limitado**: iOS pode pausar o tracking idle se o usuário deixar o app fechado por muito tempo

## Tests recomendados após build

1. Ficar online → checar notificação persistente "Online — aguardando corridas"
2. Enviar push de corrida (ferramentas → exp.host) → som alto deve tocar mesmo em silencioso
3. Tocar na notificação → tela full-screen aparece com countdown
4. Aceitar → vai pra Home → tela de corrida ativa abre
5. Sair do app → tela permanece, notificação ainda visível
6. Voltar ao app → estado preservado
