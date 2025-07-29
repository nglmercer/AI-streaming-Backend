// comments.ts – con try/catch robusto
import { Hono } from 'hono';
import { messageQueue } from '../tools/messageQueue.js';

const router = new Hono();

interface MessagesData {
  text: string;
}

// POST /add
router.post('/add', async (c) => {
  try {
    const body = await c.req.json();
    const { text } = body as MessagesData;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return c.json({ success: false, message: 'Text is required' }, 400);
    }

    const result = messageQueue.add(text.trim());
    return c.json({ success: true, result });
  } catch (err: any) {
    console.error('[POST /add] Error:', err);
    return c.json({ success: false, message: 'Invalid JSON or server error' }, 400);
  }
});

// GET /all
router.get('/all', (c) => {
  try {
    const messages = messageQueue.getAll();
    return c.json({ success: true, messages });
  } catch (err: any) {
    console.error('[GET /all] Error:', err);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// GET /next – no marca como leído
router.get('/next', (c) => {
  try {
    const message = messageQueue.getNextUnread(false);
    return c.json({ success: true, message });
  } catch (err: any) {
    console.error('[GET /next] Error:', err);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

// GET /next-unread – marca como leído
router.get('/next-unread', (c) => {
  try {
    const message = messageQueue.getNextUnread(true);
    return c.json({ success: true, message });
  } catch (err: any) {
    console.error('[GET /next-unread] Error:', err);
    return c.json({ success: false, message: 'Server error' }, 500);
  }
});

export default router;