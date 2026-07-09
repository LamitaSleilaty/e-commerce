const prisma = require("../config/prisma");

/**
 * n8n calls this on a schedule (e.g. every hour) to fetch carts abandoned
 * for more than N hours, so it can send reminder emails.
 * Secure this route with the shared secret in N8N_API_KEY (checked in routes/webhooks.js).
 */
async function getAbandonedCarts(req, res) {
  const hoursAgo = Number(req.query.hours) || 3;
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

  const carts = await prisma.cartItem.findMany({
    where: { updatedAt: { lt: cutoff } },
    include: { user: { select: { id: true, email: true, firstName: true } }, product: true },
  });

  // Group by user
  const byUser = {};
  for (const item of carts) {
    if (!byUser[item.user.id]) byUser[item.user.id] = { user: item.user, items: [] };
    byUser[item.user.id].items.push(item);
  }

  res.json({ abandonedCarts: Object.values(byUser) });
}

/**
 * n8n calls this to fetch products below a stock threshold for its
 * daily low-stock digest, as an alternative to the real-time trigger.
 */
async function getLowStockProducts(req, res) {
  const threshold = Number(req.query.threshold) || 5;
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: threshold } },
  });
  res.json({ products });
}

module.exports = { getAbandonedCarts, getLowStockProducts };
