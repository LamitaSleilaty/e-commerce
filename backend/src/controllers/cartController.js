const { z } = require("zod");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

async function getCart(req, res) {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: { include: { images: true } } },
  });
  const subtotal = items
    .reduce((sum, i) => sum.plus(new Prisma.Decimal(i.product.price).times(i.quantity)), new Prisma.Decimal(0))
    .toDecimalPlaces(2);
  res.json({ items, subtotal: subtotal.toNumber() });
}

async function addItem(req, res) {
  const { productId, quantity } = addItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId: req.user.id, productId } },
  });
  const requestedTotal = (existing?.quantity ?? 0) + quantity;
  if (requestedTotal > product.stock) return res.status(400).json({ error: "Insufficient stock" });

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: req.user.id, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: req.user.id, productId, quantity },
  });

  await prisma.browsingEvent.create({
    data: { userId: req.user.id, productId, eventType: "add_to_cart" },
  }).catch(() => {});

  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const quantity = z.number().int().positive().parse(req.body.quantity);

  const cartItem = await prisma.cartItem.findFirst({
    where: { id: req.params.itemId, userId: req.user.id },
    include: { product: true },
  });
  if (!cartItem) return res.status(404).json({ error: "Cart item not found" });
  if (quantity > cartItem.product.stock) {
    return res.status(400).json({ error: "Insufficient stock" });
  }

  const item = await prisma.cartItem.update({
    where: { id: cartItem.id },
    data: { quantity },
  });
  res.json({ item });
}

async function removeItem(req, res) {
  const result = await prisma.cartItem.deleteMany({
    where: { id: req.params.itemId, userId: req.user.id },
  });
  if (result.count === 0) return res.status(404).json({ error: "Cart item not found" });
  res.status(204).send();
}

module.exports = { getCart, addItem, updateItem, removeItem };
