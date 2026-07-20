const prisma = require("../config/prisma");
const { assertAffected } = require("../utils/ownership");

function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}

async function createAddress(userId, data) {
  if (data.isDefault) {
    await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
  }
  return prisma.address.create({ data: { ...data, userId } });
}

async function deleteAddress(userId, addressId) {
  const result = await prisma.address.deleteMany({ where: { id: addressId, userId } });
  assertAffected(result, "Address not found");
}

module.exports = { listAddresses, createAddress, deleteAddress };
