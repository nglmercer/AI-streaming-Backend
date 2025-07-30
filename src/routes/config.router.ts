// config.router.ts
import { Hono } from 'hono';
import { getConfig, updateConfig,type DefaulConfig } from '../config.js'; // Ajusta la ruta según tu proyecto

const router = new Hono();

// GET /config → devuelve la configuración completa
router.get('/', async (c) => {
  try {
    const cfg = await getConfig();
    return c.json(cfg);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Failed to load config' }, 500);
  }
});

// PATCH /config → actualiza solo los campos enviados
router.patch('/', async (c) => {
  try {
    const body = await c.req.json<Partial<DefaulConfig>>();
    const updated = await updateConfig(body);
    return c.json(updated);
  } catch (err) {
    console.error(err);
    return c.json({ error: 'Invalid payload' }, 400);
  }
});

export default router;