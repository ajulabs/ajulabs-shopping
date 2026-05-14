import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { corsOptions } from './utils/cors';
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
import { initSocket } from './utils/socket';

const app = express();
const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT || 3000;

app.use(cors(corsOptions));
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🛒 AjuLabs API',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      auth: '/auth',
      lojas: '/lojas',
      produtos: '/produtos',
      pedidos: '/pedidos',
      chat: '/chat',
      avaliacoes: '/avaliacoes',
      perfil: '/perfil',
      enderecos: '/enderecos',
      entregador: '/entregador',
      lojista: '/lojista',
    },
  });
});

app.use('/auth', authRoutes);
app.use('/lojas', lojasRoutes);
app.use('/produtos', produtosRoutes);
app.use('/pedidos', pedidosRoutes);
app.use('/chat', chatRoutes);
app.use('/avaliacoes', avaliacoesRoutes);
app.use('/perfil', perfilRoutes);
app.use('/enderecos', enderecosRoutes);
app.use('/entregador', entregadorRoutes);
app.use('/lojista', lojistaRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

server.listen(PORT, () => {
  console.log(`\n🚀 AjuLabs API rodando em http://localhost:${PORT}\n`);
});
