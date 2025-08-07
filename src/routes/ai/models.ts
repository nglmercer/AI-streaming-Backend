import { Hono } from "hono";
import { textmodelList, providertxtKeys,providerKeys } from "../../ai/factory.js";
import { ProviderConfigKeys } from "../../config.js";
const app = new Hono();

// GET endpoint to retrieve the list of AI models
app.get("/models", (c) => {
  try {
    return c.json({
      success: true,
      data: textmodelList,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to retrieve model list",
    }, 500);
  }
});
// GET endpoint to retrieve the list of AI providers
app.get("/chat", (c) => {
  try {
    return c.json({
      success: true,
      data: providertxtKeys,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to retrieve provider list",
    }, 500);
  }
});
// GET endpoint to retrieve the list of AI providers
app.get("/all", (c) => {
  try {
    return c.json({
      success: true,
      data: providerKeys,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to retrieve provider list",
    }, 500);
  }
});
// GET endpoint to retrieve the list of AI providers
app.get("/config", (c) => {
  try {
    return c.json({
      success: true,
      data: ProviderConfigKeys,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: "Failed to retrieve provider list",
    }, 500);
  }
});


export default app;
