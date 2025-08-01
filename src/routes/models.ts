import { Hono } from 'hono';
import { get2dModel,getListModels } from '../tools/model-loader.js';
const router = new Hono();
router.get('/list',async (c) => {
  const models = await getListModels();
  return c.json(models);
})
router.get('/json/:modelName', async (c) => {
  const modelName = c.req.param('modelName');
  if (!modelName) {
    return c.json({ error: 'Model name is required' }, 400);
  }
  const model = await get2dModel(modelName);
  if (!model) {
    return c.json({ error: 'Model not found' }, 404);
  }
  return c.json(model);
});
export default router;