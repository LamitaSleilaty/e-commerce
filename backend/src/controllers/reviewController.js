const { z } = require("zod");
const reviewService = require("../services/reviewService");

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

async function createReview(req, res) {
  const data = reviewSchema.parse(req.body);
  const review = await reviewService.createReview(req.user.id, req.params.id, data);
  res.status(201).json({ review });
}

async function updateReview(req, res) {
  const data = reviewSchema.partial().parse(req.body);
  const review = await reviewService.updateReview(req.user.id, req.params.id, data);
  res.json({ review });
}

async function deleteReview(req, res) {
  await reviewService.deleteReview(req.user.id, req.params.id);
  res.status(204).send();
}

module.exports = { createReview, updateReview, deleteReview };
