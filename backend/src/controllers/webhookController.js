const prisma = require("../config/prisma");


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


async function getLowStockProducts(req, res) {
  const threshold = Number(req.query.threshold) || 5;
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: threshold } },
  });
  res.json({ products });
}

module.exports = { getAbandonedCarts, getLowStockProducts };
