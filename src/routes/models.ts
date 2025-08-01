import { Hono } from 'hono';
import { getModel } from '../tools/model-loader.js';
const router = new Hono();
router.get('/json/:modelName', async (c) => {
  const modelName = c.req.param('modelName');
  if (!modelName) {
    return c.json({ error: 'Model name is required' }, 400);
  }
  const model = await getModel(modelName);
  if (!model) {
    return c.json({ error: 'Model not found' }, 404);
  }
  return c.json(model);
});
export default router;