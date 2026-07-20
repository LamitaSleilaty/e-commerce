const { z } = require("zod");
const addressService = require("../services/addressService");

const addressSchema = z.object({
  label: z.string().min(1),
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  zipCode: z.string().min(1),
  isDefault: z.boolean().optional(),
});

async function listAddresses(req, res) {
  const addresses = await addressService.listAddresses(req.user.id);
  res.json({ addresses });
}

async function createAddress(req, res) {
  const data = addressSchema.parse(req.body);
  const address = await addressService.createAddress(req.user.id, data);
  res.status(201).json({ address });
}

async function deleteAddress(req, res) {
  await addressService.deleteAddress(req.user.id, req.params.id);
  res.status(204).send();
}

module.exports = { listAddresses, createAddress, deleteAddress };
