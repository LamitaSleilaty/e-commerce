const prisma = require("../config/prisma");

const STOPWORDS = new Set([
  "the", "a", "an", "for", "to", "of", "and", "or", "in", "on", "with", "my", "me", "i",
  "is", "are", "can", "you", "your", "help", "find", "looking", "want", "need", "please",
  "some", "any", "have", "does", "that", "this", "them", "there", "about", "give",
  "good", "best", "gift", "under", "over", "below", "above", "than", "less", "more",
  "dollars", "dollar", "what", "should", "wear", "items", "item", "products", "product",
  "things", "thing", "stuff",
]);

// Maps common shopping vocabulary to this store's actual category names, since
// product copy rarely uses the exact words a customer searches with.
const CATEGORY_ALIASES = {
  beauty: ["Beauty"], skincare: ["Beauty"], skin: ["Beauty"], makeup: ["Beauty"],
  cosmetics: ["Beauty"], serum: ["Beauty"], lipstick: ["Beauty"],
  clothes: ["Women", "Men", "Kids"], clothing: ["Women", "Men", "Kids"],
  fashion: ["Women", "Men", "Kids"], outfit: ["Women", "Men", "Kids"], apparel: ["Women", "Men", "Kids"],
  women: ["Women"], womens: ["Women"], men: ["Men"], mens: ["Men"],
  kid: ["Kids"], kids: ["Kids"], children: ["Kids"], child: ["Kids"], toy: ["Kids"], toys: ["Kids"], baby: ["Kids"],
  electronics: ["Electronics"], gadget: ["Electronics"], gadgets: ["Electronics"],
  tech: ["Electronics"], charger: ["Electronics"], power: ["Electronics"],
  laptop: ["Electronics"], laptops: ["Electronics"], computer: ["Electronics"], notebook: ["Electronics"],
  home: ["Home & Living"], decor: ["Home & Living"], furniture: ["Home & Living"],
  kitchen: ["Home & Living"], living: ["Home & Living"],
};

function extractKeywords(message) {
  return [
    ...new Set(
      message
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    ),
  ].slice(0, 6);
}

// Cheap singular/plural fallback so "laptops" also matches a product named "Laptop"
function keywordVariants(kw) {
  return kw.endsWith("s") && kw.length > 3 ? [kw, kw.slice(0, -1)] : [kw, `${kw}s`];
}

function extractMaxPrice(message) {
  const match = message.match(/(?:under|below|less than|max(?:imum)?)\s*\$?\s*(\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Finds real products from the catalog relevant to a free-text customer message,
 * so the AI assistant can ground its answers in actual store inventory instead of
 * inventing products or suggesting other retailers.
 */
async function findRelevantProducts(message, { limit = 6 } = {}) {
  const keywords = extractKeywords(message);
  const maxPrice = extractMaxPrice(message);
  const aliasedCategories = [...new Set(keywords.flatMap((kw) => CATEGORY_ALIASES[kw] ?? []))];

  const where = {
    isActive: true,
    ...(maxPrice ? { price: { lte: maxPrice } } : {}),
  };

  if (keywords.length > 0 || aliasedCategories.length > 0) {
    where.OR = [
      ...keywords.flatMap((kw) =>
        keywordVariants(kw).flatMap((v) => [
          { name: { contains: v, mode: "insensitive" } },
          { description: { contains: v, mode: "insensitive" } },
        ])
      ),
      ...aliasedCategories.map((name) => ({ category: { name: { equals: name, mode: "insensitive" } } })),
    ];
  }

  const select = {
    name: true,
    price: true,
    description: true,
    stock: true,
    category: { select: { name: true } },
  };

  let products = await prisma.product.findMany({
    where,
    select,
    take: limit,
    orderBy: keywords.length > 0 ? undefined : { createdAt: "desc" },
  });

  if (products.length === 0 && maxPrice) {
    products = await prisma.product.findMany({
      where: { isActive: true, price: { lte: maxPrice } },
      select,
      take: limit,
      orderBy: { price: "asc" },
    });
  }

  return products;
}

/**
 * Generates "you may also like" recommendations for a user based on:
 *  - categories of products they've viewed/purchased/favorited
 *  - excluding products already owned or in cart
 * This is a lightweight collaborative/content heuristic. For deeper personalization,
 * feed this same signal data (BrowsingEvent, Review, Favorite) into OpenClaw as context.
 */
async function getRecommendationsForUser(userId, limit = 10) {
  const events = await prisma.browsingEvent.findMany({
    where: { userId },
    include: { product: { select: { categoryId: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const categoryIds = [...new Set(events.map((e) => e.product.categoryId))];

  if (categoryIds.length === 0) {
    // Cold start: return best-rated / most-favorited products
    return prisma.product.findMany({
      where: { isActive: true },
      include: { images: true, _count: { select: { favorites: true } } },
      orderBy: { favorites: { _count: "desc" } },
      take: limit,
    });
  }

  const viewedProductIds = events.map((e) => e.productId);

  return prisma.product.findMany({
    where: {
      isActive: true,
      categoryId: { in: categoryIds },
      id: { notIn: viewedProductIds },
    },
    include: { images: true },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

module.exports = { getRecommendationsForUser, findRelevantProducts };
