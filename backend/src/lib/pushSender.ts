import { logger } from './logger';
import { prisma } from '../utils/prisma';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

export interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

interface ExpoPushTicket {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
}

interface ExpoPushResponse {
  data?: ExpoPushTicket[];
  errors?: Array<{ code: string; message: string }>;
}

/**
 * Verifica se um token tem o formato esperado pelo Expo.
 * Aceita os formatos ExponentPushToken[xxx] e ExpoPushToken[xxx].
 */
export function isExpoPushToken(token: string): boolean {
  return /^Expo(?:nent)?PushToken\[[^\]]+\]$/.test(token);
}

/**
 * Remove um token do banco quando o Expo retorna que está inválido.
 * Erros que devem desativar: DeviceNotRegistered, InvalidCredentials.
 */
async function desativarTokenInvalido(expoToken: string, motivo: string): Promise<void> {
  try {
    await prisma.dispositivoPush.updateMany({
      where: { expoToken },
      data: { ativo: false },
    });
    logger.info({ expoToken, motivo }, 'token push desativado');
  } catch (err) {
    logger.error({ err, expoToken }, 'falha ao desativar token push');
  }
}

/**
 * Envia uma ou mais mensagens via Expo Push API.
 * Em caso de DeviceNotRegistered, marca o token como inativo no banco.
 *
 * Não lança em caso de falha de rede — apenas loga. Push é best-effort:
 * a notificação realtime via WebSocket continua sendo o canal principal.
 */
export async function enviarPush(messages: PushMessage | PushMessage[]): Promise<void> {
  const lista = Array.isArray(messages) ? messages : [messages];
  if (lista.length === 0) return;

  const validas = lista.filter(m => {
    if (!isExpoPushToken(m.to)) {
      logger.warn({ to: m.to }, 'token push em formato inválido, ignorando');
      return false;
    }
    return true;
  });
  if (validas.length === 0) return;

  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(
        validas.map(m => ({
          to: m.to,
          title: m.title,
          body: m.body,
          data: m.data ?? {},
          sound: m.sound === null ? null : 'default',
          badge: m.badge,
          priority: m.priority ?? 'high',
          channelId: m.channelId ?? 'default',
        })),
      ),
    });

    if (!res.ok) {
      logger.error(
        { status: res.status, statusText: res.statusText },
        'expo push api retornou erro HTTP',
      );
      return;
    }

    const json = (await res.json()) as ExpoPushResponse;
    if (json.errors?.length) {
      logger.error({ errors: json.errors }, 'expo push api retornou erros');
    }
    const tickets = json.data ?? [];
    for (let i = 0; i < tickets.length; i++) {
      const t = tickets[i];
      if (t.status === 'error') {
        const code = t.details?.error;
        if (code === 'DeviceNotRegistered' || code === 'InvalidCredentials') {
          await desativarTokenInvalido(validas[i].to, code);
        } else {
          logger.warn(
            { code, message: t.message, to: validas[i].to },
            'ticket de push com erro',
          );
        }
      }
    }
  } catch (err) {
    logger.error({ err }, 'falha ao enviar push');
  }
}

type DonoDispositivo =
  | { tipo: 'consumidor'; id: string }
  | { tipo: 'lojista'; id: string }
  | { tipo: 'entregador'; id: string };

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /**
   * Categoria desta notificação. Se o dono tiver opt-out registrado pra esta
   * categoria, o push é silenciosamente descartado.
   *
   * Opcional para compatibilidade com chamadas legadas (sem opt-out aplicado).
   */
  categoria?: string;
  /**
   * Canal Android (configurado no app via Notifications.setNotificationChannelAsync).
   * Permite usar canais com som customizado, importância MAX, full-screen intent etc.
   * Ignorado em iOS — iOS usa categorias/critical alerts via entitlement.
   */
  channelId?: string;
  /**
   * Prioridade do push: 'high' acorda o dispositivo imediatamente.
   * Use em alertas críticos (corrida nova). Default = 'default'.
   */
  priority?: 'default' | 'normal' | 'high';
}

/**
 * Checa se o dono optou por NÃO receber esta categoria.
 * Retorna true se deve pular o envio.
 */
async function estaOptOut(dono: DonoDispositivo, categoria: string): Promise<boolean> {
  try {
    const where =
      dono.tipo === 'consumidor'
        ? { consumidorId: dono.id, categoria }
        : dono.tipo === 'lojista'
          ? { lojistaId: dono.id, categoria }
          : { entregadorId: dono.id, categoria };

    const linha = await prisma.preferenciaNotificacaoOptOut.findFirst({
      where,
      select: { id: true },
    });
    return linha !== null;
  } catch (err) {
    // Se a consulta falhar, NÃO bloqueia o push — pref é só uma camada
    // de preferência, não pode quebrar a entrega.
    logger.error({ err, dono, categoria }, 'falha ao consultar opt-out de notificacao');
    return false;
  }
}

/**
 * Busca tokens ativos do dono e dispara push pra todos.
 * Se houver categoria + opt-out registrado, descarta silenciosamente.
 * Best-effort: nunca lança — falha de push não pode quebrar fluxos.
 */
async function enviarPushParaDono(dono: DonoDispositivo, payload: PushPayload): Promise<void> {
  try {
    if (payload.categoria && (await estaOptOut(dono, payload.categoria))) {
      logger.debug({ dono, categoria: payload.categoria }, 'push descartado por opt-out');
      return;
    }

    const where =
      dono.tipo === 'consumidor'
        ? { consumidorId: dono.id, ativo: true }
        : dono.tipo === 'lojista'
          ? { lojistaId: dono.id, ativo: true }
          : { entregadorId: dono.id, ativo: true };

    const dispositivos = await prisma.dispositivoPush.findMany({
      where,
      select: { expoToken: true },
    });
    if (dispositivos.length === 0) return;

    await enviarPush(
      dispositivos.map((d: { expoToken: string }) => ({
        to: d.expoToken,
        title: payload.title,
        body: payload.body,
        data: payload.data,
        channelId: payload.channelId,
        priority: payload.priority,
      })),
    );
  } catch (err) {
    logger.error({ err, dono }, 'falha ao enviar push para dono');
  }
}

/** Envia push pra todos os dispositivos ativos de um consumidor. */
export function enviarPushParaConsumidor(consumidorId: string, payload: PushPayload): Promise<void> {
  return enviarPushParaDono({ tipo: 'consumidor', id: consumidorId }, payload);
}

/** Envia push pra todos os dispositivos ativos de um lojista. */
export function enviarPushParaLojista(lojistaId: string, payload: PushPayload): Promise<void> {
  return enviarPushParaDono({ tipo: 'lojista', id: lojistaId }, payload);
}

/** Envia push pra todos os dispositivos ativos de um entregador. */
export function enviarPushParaEntregador(entregadorId: string, payload: PushPayload): Promise<void> {
  return enviarPushParaDono({ tipo: 'entregador', id: entregadorId }, payload);
}

/**
 * @deprecated Use enviarPushParaConsumidor. Mantido por compat durante a transição.
 */
export function enviarPushParaUsuario(
  usuarioId: string,
  payload: PushPayload & { appTipo?: string },
): Promise<void> {
  return enviarPushParaConsumidor(usuarioId, payload);
}
