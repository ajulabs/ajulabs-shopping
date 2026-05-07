import { Request, Response, NextFunction } from 'express';
import { verificarToken, TokenPayload } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.substring(7);
    const payload = verificarToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function authUsuario(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.tipo !== 'usuario') {
    return res.status(403).json({ error: 'Acesso negado: apenas consumidores' });
  }
  next();
}

export function authEntregador(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.tipo !== 'entregador') {
    return res.status(403).json({ error: 'Acesso negado: apenas entregadores' });
  }
  next();
}

export function authLojista(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.tipo !== 'lojista') {
    return res.status(403).json({ error: 'Acesso negado: apenas lojistas' });
  }
  next();
}
