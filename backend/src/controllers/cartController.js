const { z } = require("zod");
const cartService = require("../services/cartService");

const addItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
});

async function getCart(req, res) {
  const cart = await cartService.getCart(req.user.id);
  res.json(cart);
}

async function addItem(req, res) {
  const data = addItemSchema.parse(req.body);
  const item = await cartService.addItem(req.user.id, data);
  res.status(201).json({ item });
}

async function updateItem(req, res) {
  const quantity = z.number().int().positive().parse(req.body.quantity);
  const item = await cartService.updateItem(req.user.id, req.params.itemId, quantity);
  res.json({ item });
}

async function removeItem(req, res) {
  await cartService.removeItem(req.user.id, req.params.itemId);
  res.status(204).send();
}

module.exports = { getCart, addItem, updateItem, removeItem };
