const prisma = require("../config/prisma");
const { assertAffected } = require("../utils/ownership");
const { notFound } = require("../utils/httpErrors");

function listFavorites(userId) {
  return prisma.favorite.findMany({
    where: { userId },
    include: { product: { include: { images: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });
}

async function addFavorite(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product not found");

  return prisma.favorite.upsert({
    where: { userId_productId: { userId, productId } },
    update: {},
    create: { userId, productId },
  });
}

async function removeFavorite(userId, productId) {
  const result = await prisma.favorite.deleteMany({ where: { productId, userId } });
  assertAffected(result, "Favorite not found");
}

module.exports = { listFavorites, addFavorite, removeFavorite };
