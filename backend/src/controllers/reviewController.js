const { z } = require("zod");
const prisma = require("../config/prisma");

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

async function createReview(req, res) {
  const data = reviewSchema.parse(req.body);
  const productId = req.params.id;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });

  const review = await prisma.review.create({
    data: { ...data, productId, userId: req.user.id },
    include: { user: { select: { firstName: true, lastName: true } } },
  });

  res.status(201).json({ review });
}

async function updateReview(req, res) {
  const data = reviewSchema.partial().parse(req.body);

  const existing = await prisma.review.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) return res.status(404).json({ error: "Review not found" });

  const review = await prisma.review.update({ where: { id: existing.id }, data });
  res.json({ review });
}

async function deleteReview(req, res) {
  const existing = await prisma.review.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!existing) return res.status(404).json({ error: "Review not found" });

  await prisma.review.delete({ where: { id: existing.id } });
  res.status(204).send();
}

module.exports = { createReview, updateReview, deleteReview };
