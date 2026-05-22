import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error(
    'JWT_SECRET e JWT_REFRESH_SECRET são obrigatórios. Configure as variáveis de ambiente.',
  );
}

export interface TokenPayload {
  id: string;
  tipo: 'usuario' | 'entregador' | 'lojista';
}

export function gerarToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: '1h' });
}

export function gerarRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET!, { expiresIn: '30d' });
}

export function verificarToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET!) as TokenPayload;
}

export function verificarRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET!) as TokenPayload;
}
