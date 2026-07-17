const { z } = require("zod");
const prisma = require("../config/prisma");

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
  const addresses = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "desc" },
  });
  res.json({ addresses });
}

async function createAddress(req, res) {
  const data = addressSchema.parse(req.body);

  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
  }

  const address = await prisma.address.create({ data: { ...data, userId: req.user.id } });
  res.status(201).json({ address });
}

async function deleteAddress(req, res) {
  const result = await prisma.address.deleteMany({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (result.count === 0) return res.status(404).json({ error: "Address not found" });
  res.status(204).send();
}

module.exports = { listAddresses, createAddress, deleteAddress };