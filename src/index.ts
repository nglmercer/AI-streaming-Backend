// index.js - Solución integrada
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static'
import 'dotenv/config'
import transcriptRouter from './routes/transcript.js';
import commentsRouter from './routes/comments.js'
import configRouter from './routes/config.router.js'
import charactersRouter from './routes/characters.router.js'
import createWsRouter from './ws/wsRouter.js';
import modelsRouter from './routes/models.js';
import AIdataRouter from './routes/ai/models.js'
import { join } from 'path';
const port = 12393;
const app = new Hono();
const publicPath = join(process.cwd(), '/src/public');
app.use(cors());
app.use('/*', serveStatic({ root: './src/public' }))
app.get('/', (c) => c.text('Hello Hono!'));
app.route('/transcript', transcriptRouter);
app.route('/api/messages', commentsRouter);
app.route('/api/msg', commentsRouter);
app.route('/api/providers', AIdataRouter);
app.route('/config',configRouter);
app.route('/characters', charactersRouter);
app.route('/models', modelsRouter);
// Iniciar servidor y capturar la instancia del servidor HTTP
const server = serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log(`✅ Servidor HTTP funcionando en http://localhost:${info.port}`);
});
createWsRouter(server as any);

// Añadir WebSocket al servidor de Hono

console.log(`🔌 WebSocket disponible en ws://localhost:${port}`);