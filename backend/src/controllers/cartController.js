const { z } = require("zod");
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
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  res.json({ items, subtotal });
}

async function addItem(req, res) {
  const { productId, quantity } = addItemSchema.parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.stock < quantity) return res.status(400).json({ error: "Insufficient stock" });

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
  const item = await prisma.cartItem.update({
    where: { id: req.params.itemId },
    data: { quantity },
  });
  res.json({ item });
}

async function removeItem(req, res) {
  await prisma.cartItem.delete({ where: { id: req.params.itemId } });
  res.status(204).send();
}

module.exports = { getCart, addItem, updateItem, removeItem };
