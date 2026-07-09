const { z } = require("zod");
const prisma = require("../config/prisma");

async function listFavorites(req, res) {
  const favorites = await prisma.favorite.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { images: true, category: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ favorites });
}

async function addFavorite(req, res) {
  const productId = z.string().uuid().parse(req.body.productId);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const favorite = await prisma.favorite.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: {},
    create: { userId: req.user.id, productId },
  });

  res.status(201).json({ favorite });
}

async function removeFavorite(req, res) {
  const deleted = await prisma.favorite.deleteMany({
    where: { productId: req.params.productId, userId: req.user.id },
  });
  if (deleted.count === 0) return res.status(404).json({ error: "Favorite not found" });
  res.status(204).send();
}

module.exports = { listFavorites, addFavorite, removeFavorite };
