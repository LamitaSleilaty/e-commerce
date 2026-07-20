const { z } = require("zod");
const orderService = require("../services/orderService");

const checkoutSchema = z.object({
  addressId: z.string().uuid(),
  paymentMethod: z.string().default("card"),
});

const listAllOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const statusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
]);

async function checkout(req, res) {
  const data = checkoutSchema.parse(req.body);
  const order = await orderService.checkout(req.user.id, data);
  res.status(201).json({ order });
}

async function listOrders(req, res) {
  const orders = await orderService.listOrders(req.user.id);
  res.json({ orders });
}

async function listAllOrders(req, res) {
  const { page, limit } = listAllOrdersQuerySchema.parse(req.query);
  const { orders, total } = await orderService.listAllOrders({ page, limit });
  res.json({ orders, total, page, limit });
}

async function getOrder(req, res) {
  const order = await orderService.getOrder(req.user.id, req.params.id);
  res.json({ order });
}

async function updateOrderStatus(req, res) {
  const status = statusSchema.parse(req.body.status);
  const order = await orderService.updateOrderStatus(req.params.id, status);
  res.json({ order });
}

module.exports = { checkout, listOrders, listAllOrders, getOrder, updateOrderStatus };
