const prisma = require("../config/prisma");
const { findOwnedOrThrow } = require("../utils/ownership");
const { notFound } = require("../utils/httpErrors");

async function createReview(userId, productId, data) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw notFound("Product not found");

  return prisma.review.create({
    data: { ...data, productId, userId },
    include: { user: { select: { firstName: true, lastName: true } } },
  });
}

async function updateReview(userId, reviewId, data) {
  const existing = await findOwnedOrThrow(
    prisma.review,
    { where: { id: reviewId, userId } },
    "Review not found"
  );
  return prisma.review.update({ where: { id: existing.id }, data });
}

async function deleteReview(userId, reviewId) {
  const existing = await findOwnedOrThrow(
    prisma.review,
    { where: { id: reviewId, userId } },
    "Review not found"
  );
  await prisma.review.delete({ where: { id: existing.id } });
}

module.exports = { createReview, updateReview, deleteReview };
