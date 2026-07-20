const { notFound } = require("./httpErrors");

async function findOwnedOrThrow(delegate, { where, include }, message = "Not found") {
  const record = await delegate.findFirst(include ? { where, include } : { where });
  if (!record) throw notFound(message);
  return record;
}

function assertAffected(result, message = "Not found") {
  if (result.count === 0) throw notFound(message);
  return result;
}

module.exports = { findOwnedOrThrow, assertAffected };
