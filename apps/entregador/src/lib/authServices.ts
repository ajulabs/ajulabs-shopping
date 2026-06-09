/**
 * Services com refresh de token automático. Importe daqui em vez de
 * '@ajulabs/api-client' nas telas com chamadas autenticadas.
 * Só inclui Services 100% token-first (token como primeiro argumento).
 */
import { EntregadorService as RawEntregadorService } from '@ajulabs/api-client';
import { wrapServiceWithAuth } from './withAuthRefresh';

export const EntregadorService = wrapServiceWithAuth(RawEntregadorService);
