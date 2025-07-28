// index.js (sin cambios)
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createServer } from 'http';
import 'dotenv/config'
import transcriptRouter from './routes/transcript.js';
import createWsRouter from './routes/wsRouter.js';

const port = 12393;
const app = new Hono();
app.use(cors());

app.get('/', (c) => c.text('Hello Hono!'));
app.route('/transcript', transcriptRouter);

const httpServer = createServer();
createWsRouter(httpServer); // Sigue funcionando igual

serve({
  fetch: app.fetch,
  port: port,
  createServer: () => httpServer
}, (info) => {
  console.log(`✅ Servidor HTTP funcionando en http://localhost:${info.port}`);
});