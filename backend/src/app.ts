import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { corsOptions } from './utils/cors';
import { logger } from './lib/logger';
import authRoutes from './routes/auth.routes';
import lojasRoutes from './routes/lojas.routes';
import produtosRoutes from './routes/produtos.routes';
import pedidosRoutes from './routes/pedidos.routes';
import chatRoutes from './routes/chat.routes';
import avaliacoesRoutes from './routes/avaliacoes.routes';
import perfilRoutes from './routes/perfil.routes';
import enderecosRoutes from './routes/enderecos.routes';
import entregadorRoutes from './routes/entregador.routes';
import lojistaRoutes from './routes/lojista.routes';
import ticketsRoutes from './routes/tickets.routes';
import favoritosRoutes from './routes/favoritos.routes';
import geocodeRoutes from './routes/geocode.routes';

const app = express();

app.use(cors(corsOptions));
app.use(express.json());

app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'incoming request');
  next();
});

app.get('/', (_req, res) => {
  res.json({ message: '🛒 AjuLabs API', version: '1.0.0', status: 'online' });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/lojas', lojasRoutes);
app.use('/v1/produtos', produtosRoutes);
app.use('/v1/pedidos', pedidosRoutes);
app.use('/v1/chat', chatRoutes);
app.use('/v1/avaliacoes', avaliacoesRoutes);
app.use('/v1/perfil', perfilRoutes);
app.use('/v1/enderecos', enderecosRoutes);
app.use('/v1/entregador', entregadorRoutes);
app.use('/v1/lojista', lojistaRoutes);
app.use('/v1/tickets', ticketsRoutes);
app.use('/v1/favoritos', favoritosRoutes);
app.use('/v1/geocode', geocodeRoutes);

for (const prefix of [
  'auth',
  'lojas',
  'produtos',
  'pedidos',
  'chat',
  'avaliacoes',
  'perfil',
  'enderecos',
  'entregador',
  'lojista',
  'tickets',
  'favoritos',
  'geocode',
]) {
  app.use(`/${prefix}`, (req, res) => res.redirect(308, `/v1/${prefix}${req.url}`));
}

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    logger.error({ err }, 'unhandled error');
    const appErr = err as { statusCode?: number; message?: string };
    const status = appErr.statusCode ?? 500;
    const message = status < 500 ? appErr.message : 'Erro interno do servidor';
    res.status(status).json({ error: message });
  },
);

export { app };
