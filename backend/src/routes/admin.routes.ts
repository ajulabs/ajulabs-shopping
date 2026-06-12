import { Router, Response } from 'express';
import { z } from 'zod';
import { authMiddleware, authAdmin, AuthRequest } from '../middleware/auth';
import * as svc from '../services/admin.service';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// Login do admin de plataforma (público).
router.post('/login', async (req, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(422).json({ error: 'E-mail e senha são obrigatórios.' });
  }
  try {
    const result = await svc.loginAdmin(parsed.data.email, parsed.data.senha);
    res.json(result);
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Erro ao entrar.' });
  }
});

// A partir daqui, tudo exige token de admin.
router.use(authMiddleware, authAdmin);

// Fotos de perfil aguardando moderação.
router.get('/fotos/pendentes', async (_req: AuthRequest, res: Response) => {
  const fotos = await svc.listarFotosPendentes();
  res.json({ fotos });
});

router.post('/fotos/:id/aprovar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await svc.aprovarFoto(req.params.id);
    res.json(result);
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Erro ao aprovar.' });
  }
});

router.post('/fotos/:id/rejeitar', async (req: AuthRequest, res: Response) => {
  try {
    const result = await svc.rejeitarFoto(req.params.id);
    res.json(result);
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode ?? 500;
    res.status(status).json({ error: e instanceof Error ? e.message : 'Erro ao rejeitar.' });
  }
});

export default router;
