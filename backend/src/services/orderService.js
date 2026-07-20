const crypto = require("crypto");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const n8n = require("./n8nService");
const { findOwnedOrThrow } = require("../utils/ownership");
const { badRequest, notFound } = require("../utils/httpErrors");
const { TAX_RATE, SHIPPING_FEE, FREE_SHIPPING_THRESHOLD, LOW_STOCK_THRESHOLD } = require("../config/business");

const ORDER_ITEMS_INCLUDE = { items: { include: { product: true } } };

const STATUS_TRANSITIONS = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};


const STOCK_RESTORING_STATUSES = new Set(["CANCELLED", "REFUNDED"]);

function generateOrderNumber() {
  return `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function computeTotals(cartItems) {
  const subtotal = cartItems
    .reduce((sum, i) => sum.plus(new Prisma.Decimal(i.product.price).times(i.quantity)), new Prisma.Decimal(0))
    .toDecimalPlaces(2);
  const tax = subtotal.times(TAX_RATE).toDecimalPlaces(2);
  const shippingFee = subtotal.greaterThan(FREE_SHIPPING_THRESHOLD) ? new Prisma.Decimal(0) : new Prisma.Decimal(SHIPPING_FEE);
  const total = subtotal.plus(tax).plus(shippingFee).toDecimalPlaces(2);
  return { subtotal, tax, shippingFee, total };
}

async function checkout(userId, { addressId, paymentMethod }) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });
  if (cartItems.length === 0) throw badRequest("Cart is empty");

  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw badRequest("Address not found");

  const { subtotal, tax, shippingFee, total } = computeTotals(cartItems);

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cartItems) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) throw badRequest(`Insufficient stock for ${item.product.name}`);
    }

    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        addressId,
        subtotal,
        tax,
        shippingFee,
        total,
        paymentMethod,
        items: {
          create: cartItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
        },
      },
      include: {
        ...ORDER_ITEMS_INCLUDE,
        address: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    await tx.cartItem.deleteMany({ where: { userId } });

    return newOrder;
  });

  n8n.sendOrderConfirmation(order);
  for (const item of order.items) {
    const updated = await prisma.product.findUnique({ where: { id: item.productId } });
    if (updated.stock <= LOW_STOCK_THRESHOLD) n8n.notifyLowStock(updated);
  }

  return order;
}

function listOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: ORDER_ITEMS_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
}

async function listAllOrders({ page, limit }) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      include: {
        ...ORDER_ITEMS_INCLUDE,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count(),
  ]);
  return { orders, total, page, limit };
}

function getOrder(userId, orderId) {
  return findOwnedOrThrow(
    prisma.order,
    { where: { id: orderId, userId }, include: { ...ORDER_ITEMS_INCLUDE, address: true } },
    "Order not found"
  );
}

async function updateOrderStatus(orderId, status) {
  const current = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_ITEMS_INCLUDE });
  if (!current) throw notFound("Order not found");

  const allowedNext = STATUS_TRANSITIONS[current.status] || [];
  if (!allowedNext.includes(status)) {
    throw badRequest(`Cannot transition order from ${current.status} to ${status}`);
  }

  const order = await prisma.$transaction(async (tx) => {
    if (STOCK_RESTORING_STATUSES.has(status)) {
      for (const item of current.items) {
        await tx.product.updateMany({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status },
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
  });

  if (status === "SHIPPED" || status === "DELIVERED") n8n.sendShippingUpdate(order);
  if (status === "DELIVERED") n8n.sendFeedbackRequest(order);

  return order;
}

module.exports = { checkout, listOrders, listAllOrders, getOrder, updateOrderStatus };
