const prisma = require("../config/prisma");
const { ABANDONED_CART_HOURS, ABANDONED_CART_WINDOW_HOURS, LOW_STOCK_THRESHOLD } = require("../config/business");

async function getAbandonedCarts(req, res) {
  const hoursAgo = Number(req.query.hours) || ABANDONED_CART_HOURS;
  const windowHours = Number(req.query.windowHours) || ABANDONED_CART_WINDOW_HOURS;
  const cutoff = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  const floor = new Date(Date.now() - (hoursAgo + windowHours) * 60 * 60 * 1000);

  const carts = await prisma.cartItem.findMany({
    where: { updatedAt: { lt: cutoff, gte: floor } },
    include: { user: { select: { id: true, email: true, firstName: true } }, product: true },
  });

  const byUser = {};
  for (const item of carts) {
    if (!byUser[item.user.id]) byUser[item.user.id] = { user: item.user, items: [] };
    byUser[item.user.id].items.push(item);
  }

  res.json({ abandonedCarts: Object.values(byUser) });
}


async function getLowStockProducts(req, res) {
  const threshold = Number(req.query.threshold) || LOW_STOCK_THRESHOLD;
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: threshold } },
  });
  res.json({ products });
}

module.exports = { getAbandonedCarts, getLowStockProducts };
