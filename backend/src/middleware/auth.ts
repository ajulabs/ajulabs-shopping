import { Request, Response, NextFunction } from 'express';
import { verificarToken, TokenPayload, PapelColaborador } from '../utils/jwt';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }
    const token = authHeader.substring(7);
    req.user = verificarToken(token);
    next();
  } catch {
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

// Admin de plataforma (equipe interna AjuLabs) — acesso ao painel administrativo.
export function authAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.tipo !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito à administração' });
  }
  next();
}

export function authColaborador(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.tipo !== 'colaborador') {
    return res.status(403).json({ error: 'Acesso negado: apenas colaboradores' });
  }
  next();
}

export function authLojistaOrColaborador(req: AuthRequest, res: Response, next: NextFunction) {
  const tipo = req.user?.tipo;
  if (tipo !== 'lojista' && tipo !== 'colaborador') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

export function requirePapel(...papeis: PapelColaborador[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.tipo === 'lojista') return next();
    const papel = req.user?.papel as PapelColaborador | undefined;
    if (!papel || !papeis.includes(papel)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }
    next();
  };
}
