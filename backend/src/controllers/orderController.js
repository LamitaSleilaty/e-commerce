const { z } = require("zod");
const crypto = require("crypto");
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

  // Validate stock before committing
  for (const item of cartItems) {
    if (item.product.stock < item.quantity) {
      return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
    }
  }

  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0);
  const tax = Number((subtotal * 0.08).toFixed(2)); // adjust tax rate as needed
  const shippingFee = subtotal > 100 ? 0 : 9.99;
  const total = Number((subtotal + tax + shippingFee).toFixed(2));

  // Transaction: create order, decrement stock, clear cart
  const order = await prisma.$transaction(async (tx) => {
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

    for (const item of cartItems) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }

    await tx.cartItem.deleteMany({ where: { userId: req.user.id } });

    return newOrder;
  });

  // Fire automation workflows (non-blocking)
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

// Admin: view every order across all customers
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

// Admin: update order status -> triggers shipping notification workflow
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
