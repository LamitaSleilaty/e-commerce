const { z } = require("zod");
const prisma = require("../config/prisma");

const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  price: z.number().positive(),
  stock: z.number().int().nonnegative().default(0),
  sku: z.string().min(1),
  categoryId: z.string().uuid(),
  specifications: z.record(z.any()).optional(),
  images: z.array(z.object({ url: z.string().url(), altText: z.string().optional() })).optional(),
});

async function listProducts(req, res) {
  const { category, search, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

  const where = {
    isActive: true,
    ...(category && { categoryId: category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(minPrice || maxPrice
      ? { price: { ...(minPrice && { gte: Number(minPrice) }), ...(maxPrice && { lte: Number(maxPrice) }) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page: Number(page), limit: Number(limit) });
}

async function getProduct(req, res) {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { images: true, category: true, reviews: { include: { user: { select: { firstName: true, lastName: true } } } } },
  });
  if (!product) return res.status(404).json({ error: "Product not found" });

 
  await prisma.browsingEvent.create({
    data: { userId: req.user?.id, productId: product.id, eventType: "view" },
  }).catch(() => {}); 

  res.json({ product });
}

async function createProduct(req, res) {
  const data = productSchema.parse(req.body);
  const { images, ...rest } = data;

  const product = await prisma.product.create({
    data: {
      ...rest,
      images: images ? { create: images } : undefined,
    },
    include: { images: true },
  });
  res.status(201).json({ product });
}

async function updateProduct(req, res) {
  const data = productSchema.partial().parse(req.body);
  const { images, ...rest } = data;

  const product = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: req.params.id } });
    }
    return tx.product.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(images ? { images: { create: images } } : {}),
      },
      include: { images: true, category: true },
    });
  });

  res.json({ product });
}

async function deleteProduct(req, res) {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
