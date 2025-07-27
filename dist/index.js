import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import transcriptRouter from './routes/transcript.js';
const app = new Hono();
app.use(cors());
app.get('/', (c) => {
    return c.text('Hello Hono!');
});
app.route('/transcript', transcriptRouter);
serve({
    fetch: app.fetch,
    port: 3000
}, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
});
