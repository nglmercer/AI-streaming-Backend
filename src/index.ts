import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createServer } from 'http';        

import transcriptRouter from './routes/transcript.js';
import createWsRouter   from './routes/wsRouter.js';

const app = new Hono();
app.use(cors());

app.get('/', (c) => c.text('Hello Hono!'));
app.route('/transcript', transcriptRouter);

const httpServer = createServer();
createWsRouter(httpServer);

const server = serve({                    
  fetch: app.fetch,
  port: 12393,
  createServer: () => httpServer       
}, (info) => {
  console.log(`HTTP server on http://localhost:${info.port}`);
});

/* monta el WebSocket sobre el mismo servidor HTTP/1 */