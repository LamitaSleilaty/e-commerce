const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const { findOwnedOrThrow, assertAffected } = require("../utils/ownership");
const { badRequest, notFound } = require("../utils/httpErrors");

async function getCart(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { include: { images: true } } },
  });
  const subtotal = items
    .reduce((sum, i) => sum.plus(new Prisma.Decimal(i.product.price).times(i.quantity)), new Prisma.Decimal(0))
    .toDecimalPlaces(2);
  return { items, subtotal: subtotal.toNumber() };
}

async function addItem(userId, { productId, quantity }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product not found");

  const existing = await prisma.cartItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  const requestedTotal = (existing?.quantity ?? 0) + quantity;
  if (requestedTotal > product.stock) throw badRequest("Insufficient stock");

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId, productId, quantity },
  });

  await prisma.browsingEvent.create({
    data: { userId, productId, eventType: "add_to_cart" },
  }).catch(() => {});

  return item;
}

async function updateItem(userId, itemId, quantity) {
  const cartItem = await findOwnedOrThrow(
    prisma.cartItem,
    { where: { id: itemId, userId }, include: { product: true } },
    "Cart item not found"
  );
  if (quantity > cartItem.product.stock) throw badRequest("Insufficient stock");

  return prisma.cartItem.update({ where: { id: cartItem.id }, data: { quantity } });
}

async function removeItem(userId, itemId) {
  const result = await prisma.cartItem.deleteMany({ where: { id: itemId, userId } });
  assertAffected(result, "Cart item not found");
}

module.exports = { getCart, addItem, updateItem, removeItem };
