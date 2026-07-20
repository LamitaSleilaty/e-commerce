const { z } = require("zod");
const aiService = require("../services/aiService");

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
});

async function chat(req, res) {
  const data = chatSchema.parse(req.body);
  const result = await aiService.chat(req.user?.id, data);
  res.json(result);
}

async function recommendations(req, res) {
  const items = await aiService.getRecommendations(req.user.id, Number(req.query.limit) || 10);
  res.json({ items });
}

async function compare(req, res) {
  const productIds = z.array(z.string().uuid()).min(2).parse(req.body.productIds);
  const result = await aiService.compareProducts(productIds);
  res.json({ comparison: result });
}

async function generateDescription(req, res) {
  const input = z
    .object({ name: z.string(), specifications: z.record(z.any()).optional(), category: z.string() })
    .parse(req.body);
  const description = await aiService.generateProductDescription(input);
  res.json({ description });
}

module.exports = { chat, recommendations, compare, generateDescription };
