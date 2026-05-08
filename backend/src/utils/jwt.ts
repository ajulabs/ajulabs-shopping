import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';

export interface TokenPayload {
  id: string;
  tipo: 'usuario' | 'entregador' | 'lojista';
}

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function gerarRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verificarRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
