const { z } = require("zod");
const prisma = require("../config/prisma");
const openclaw = require("../services/openclawService");
const { getRecommendationsForUser, findRelevantProducts } = require("../services/recommendationService");

const chatSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().uuid().optional(),
});

async function chat(req, res) {
  const { message, conversationId } = chatSchema.parse(req.body);
  const userId = req.user?.id;

  let conversation = conversationId
    ? await prisma.aiConversation.findFirst({ where: { id: conversationId, userId }, include: { messages: true } })
    : await prisma.aiConversation.create({ data: { userId }, include: { messages: true } });

  if (!conversation) return res.status(404).json({ error: "Conversation not found" });

  const history = (conversation.messages || []).map((m) => ({ role: m.role, content: m.content }));

  const recent = userId
    ? await prisma.browsingEvent.findMany({
        where: { userId },
        include: { product: { select: { name: true, categoryId: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const relevantProducts = await findRelevantProducts(message);

  
  const reply =
    relevantProducts.length === 0
      ? "I can only help with products available in our store, and I couldn't find anything matching that. Could you tell me more about what you're looking for (category, price range, etc.)?"
      : await openclaw.chatWithAssistant({
          userMessage: message,
          conversationHistory: history,
          userContext: { recentlyViewed: recent.map((r) => r.product.name) },
          relevantProducts,
        });

  await prisma.aiMessage.createMany({
    data: [
      { conversationId: conversation.id, role: "user", content: message },
      { conversationId: conversation.id, role: "assistant", content: reply },
    ],
  });

  res.json({ conversationId: conversation.id, reply });
}

async function recommendations(req, res) {
  const items = await getRecommendationsForUser(req.user.id, Number(req.query.limit) || 10);
  res.json({ items });
}

async function compare(req, res) {
  const productIds = z.array(z.string().uuid()).min(2).parse(req.body.productIds);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const result = await openclaw.compareProducts(products);
  res.json({ comparison: result });
}

async function generateDescription(req, res) {
  const { name, specifications, category } = z
    .object({ name: z.string(), specifications: z.record(z.any()).optional(), category: z.string() })
    .parse(req.body);
  const description = await openclaw.generateProductDescription({ name, specifications, category });
  res.json({ description });
}

module.exports = { chat, recommendations, compare, generateDescription };
