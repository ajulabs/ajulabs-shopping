import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import lojasRoutes from './routes/lojas.routes';
import produtosRoutes from './routes/produtos.routes';
import pedidosRoutes from './routes/pedidos.routes';
import chatRoutes from './routes/chat.routes';
import avaliacoesRoutes from './routes/avaliacoes.routes';
import perfilRoutes from './routes/perfil.routes';
import enderecosRoutes from './routes/enderecos.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
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

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`\n🚀 AjuLabs API rodando em http://localhost:${PORT}\n`);
});
