const { z } = require("zod");
const prisma = require("../config/prisma");

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

async function listCategories(req, res) {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  res.json({ categories });
}

async function createCategory(req, res) {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json({ category });
}

module.exports = { listCategories, createCategory };
