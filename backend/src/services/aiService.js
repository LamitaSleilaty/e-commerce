const prisma = require("../config/prisma");
const openclaw = require("./openclawService");
const { getRecommendationsForUser, findRelevantProducts } = require("./recommendationService");
const { findOwnedOrThrow } = require("../utils/ownership");

const MAX_HISTORY_MESSAGES = 10;

async function getOrCreateConversation(userId, conversationId) {
  if (!conversationId) {
    return prisma.aiConversation.create({ data: { userId } });
  }
  return findOwnedOrThrow(
    prisma.aiConversation,
    { where: { id: conversationId, userId } },
    "Conversation not found"
  );
}

async function chat(userId, { message, conversationId }) {
  const conversation = await getOrCreateConversation(userId, conversationId);

  const recentMessages = await prisma.aiMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: MAX_HISTORY_MESSAGES,
  });
  const history = recentMessages.reverse().map((m) => ({ role: m.role, content: m.content }));

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

  return { conversationId: conversation.id, reply };
}

function getRecommendations(userId, limit) {
  return getRecommendationsForUser(userId, limit);
}

async function compareProducts(productIds) {
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  return openclaw.compareProducts(products);
}

function generateProductDescription(input) {
  return openclaw.generateProductDescription(input);
}

module.exports = { chat, getRecommendations, compareProducts, generateProductDescription };
