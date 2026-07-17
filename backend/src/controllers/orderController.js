const { z } = require("zod");
const crypto = require("crypto");
const { Prisma } = require("@prisma/client");
const prisma = require("../config/prisma");
const n8n = require("../services/n8nService");

const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.string().default("card"),
});

function generateOrderNumber() {
  return `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

async function checkout(req, res) {
  const { addressId, paymentMethod } = checkoutSchema.parse(req.body);

  const cartItems = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: { product: true },
  });
  if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty" });

  const address = await prisma.address.findFirst({
    where: { id: addressId, userId: req.user.id },
  });
  if (!address) return res.status(400).json({ error: "Address not found" });

  const subtotal = cartItems
    .reduce((sum, i) => sum.plus(new Prisma.Decimal(i.product.price).times(i.quantity)), new Prisma.Decimal(0))
    .toDecimalPlaces(2);
  const tax = subtotal.times(0.08).toDecimalPlaces(2); // adjust tax rate as needed
  const shippingFee = subtotal.greaterThan(100) ? new Prisma.Decimal(0) : new Prisma.Decimal(9.99);
  const total = subtotal.plus(tax).plus(shippingFee).toDecimalPlaces(2);

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cartItems) {
      const result = await tx.product.updateMany({
        where: { id: item.productId, stock: { gte: item.quantity } },
        data: { stock: { decrement: item.quantity } },
      });
      if (result.count === 0) {
        const err = new Error(`Insufficient stock for ${item.product.name}`);
        err.status = 400;
        throw err;
      }
    }

    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user.id,
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
        items: { include: { product: true } },
        address: true,
        user: { select: { email: true, firstName: true, lastName: true } },
      },
    });

    await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

    return newOrder;
  });

  n8n.sendOrderConfirmation(order);
  for (const item of order.items) {
    const updated = await prisma.product.findUnique({ where: { id: item.productId } });
    if (updated.stock <= 5) n8n.notifyLowStock(updated);
  }

  res.status(201).json({ order });
}

async function listOrders(req, res) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
}

async function listAllOrders(req, res) {
  const orders = await prisma.order.findMany({
    include: {
      items: { include: { product: true } },
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json({ orders });
}

async function getOrder(req, res) {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user.id },
    include: { items: { include: { product: true } }, address: true },
  });
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json({ order });
}


async function updateOrderStatus(req, res) {
  const status = z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    .parse(req.body.status);

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { status },
    include: { user: true },
  });

  if (status === "SHIPPED" || status === "DELIVERED") {
    n8n.sendShippingUpdate(order);
  }
  if (status === "DELIVERED") {
    n8n.sendFeedbackRequest(order);
  }

  res.json({ order });
}

module.exports = { checkout, listOrders, listAllOrders, getOrder, updateOrderStatus };
