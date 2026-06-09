import { ApiUnauthorizedError } from '@ajulabs/api-client';
import { useAuthEntregadorStore } from '../store';

/**
 * Executa uma chamada de API que usa token. Se falhar com 401, renova o token
 * UMA vez e refaz a chamada. Se o refresh falhar (refreshToken expirado), o
 * store desloga e o erro é propagado.
 *
 * Use quando o token NÃO é o primeiro argumento, ou em chamadas avulsas:
 *   await withAuthRefresh((t) => PedidoChatService.buscarChat(pedidoId, t));
 */
export async function withAuthRefresh<T>(call: (token: string) => Promise<T>): Promise<T> {
  const store = useAuthEntregadorStore.getState();
  const token = store.token;
  if (!token) throw new ApiUnauthorizedError();
  try {
    return await call(token);
  } catch (err) {
    if (err instanceof ApiUnauthorizedError) {
      const ok = await store.refreshAccessToken();
      if (ok) {
        const novoToken = useAuthEntregadorStore.getState().token;
        if (novoToken) return await call(novoToken);
      }
    }
    throw err;
  }
}

type TokenFirstFn = (token: string, ...rest: any[]) => Promise<any>;

/**
 * Envolve um Service cujos métodos recebem `token` como PRIMEIRO argumento.
 * Cada método renova o token automaticamente no 401 e refaz a chamada.
 * SÓ use em Services 100% token-first (ex: EntregadorService).
 */
export function wrapServiceWithAuth<T extends Record<string, TokenFirstFn>>(service: T): T {
  const wrapped = {} as T;
  for (const key of Object.keys(service) as (keyof T)[]) {
    const fn = service[key];
    if (typeof fn !== 'function') {
      wrapped[key] = fn;
      continue;
    }
    wrapped[key] = (async (...args: any[]) =>
      withAuthRefresh((token) => fn(token, ...args.slice(1)))) as T[keyof T];
  }
  return wrapped;
}
