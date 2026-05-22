import 'dotenv/config';
import './config/env';
import http from 'http';
import { app } from './app';
import { initSocket } from './utils/socket';
import { backfillEmbeddings } from './jobs/backfillEmbeddings';
import { logger } from './lib/logger';

const server = http.createServer(app);
initSocket(server);
const PORT = process.env.PORT ?? 3000;

server.listen(PORT, () => {
  logger.info(`🚀 AjuLabs API rodando em http://localhost:${PORT}`);
  backfillEmbeddings().catch((err) => logger.error({ err }, '[backfill] erro'));
});

export { app };
