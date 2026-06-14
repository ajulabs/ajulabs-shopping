import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
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
import pushRoutes from './routes/push.routes';
import notificationPreferencesRoutes from './routes/notificationPreferences.routes';
import pedidoChatRoutes from './routes/pedido-chat.routes';
import estoqueRoutes from './routes/estoque.routes';
import rbacRoutes from './routes/rbac.routes';

const app = express();

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'incoming request');
  next();
});

app.get('/', (_req, res) => {
  res.json({ message: '🛒 AjuLabs API', version: '1.0.0', status: 'online' });
});

app.get('/openapi.json', (_req, res) => {
  res.sendFile(path.resolve(__dirname, '../openapi.json'));
});

app.get('/api-docs', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html>
<head>
  <title>AjuLabs API Docs</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
  SwaggerUIBundle({
    url: '/openapi.json',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
    layout: 'BaseLayout',
  });
</script>
</body>
</html>`);
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
app.use('/v1/push', pushRoutes);
app.use('/v1/notification-preferences', notificationPreferencesRoutes);
app.use('/v1/pedido-chat', pedidoChatRoutes);
app.use('/v1/lojista/estoque', estoqueRoutes);
app.use('/v1/lojista/rbac', rbacRoutes);

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
  'push',
  'notification-preferences',
  'pedido-chat',
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
