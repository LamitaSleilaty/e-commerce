const { z } = require("zod");
const prisma = require("../config/prisma");

const listQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

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
  const { category, search, minPrice, maxPrice, page, limit } = listQuerySchema.parse(req.query);

  const where = {
    isActive: true,
    ...(category && { categoryId: category }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ items, total, page, limit });
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
