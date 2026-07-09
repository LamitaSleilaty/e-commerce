require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const bcrypt = require("bcryptjs");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Placeholder photography (picsum.photos) — swap for real product photography later.
const img = (seed, w = 600, h = 800) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

const CATEGORIES = [
  { name: "Women", description: "Women's clothing, shoes, and accessories" },
  { name: "Men", description: "Men's clothing, shoes, and accessories" },
  { name: "Beauty", description: "Skincare, makeup, and personal care" },
  { name: "Home & Living", description: "Home decor, kitchen, and organization" },
  { name: "Electronics", description: "Gadgets, audio, and accessories" },
  { name: "Kids", description: "Kids' clothing and toys" },
];

const PRODUCTS = [
  // Women
  { sku: "WMN-001", category: "Women", name: "Ribbed Knit Midi Dress", price: 32.99, stock: 140, seed: "wmn1",
    specs: { fabric: "95% cotton, 5% spandex", fit: "slim" }, desc: "A ribbed midi dress that moves with you — soft, stretchy, easy to dress up or down." },
  { sku: "WMN-002", category: "Women", name: "Oversized Denim Jacket", price: 44.50, stock: 90, seed: "wmn2",
    specs: { fabric: "100% cotton denim", fit: "oversized" }, desc: "A washed denim jacket cut oversized for effortless layering in any season." },
  { sku: "WMN-003", category: "Women", name: "Pleated Wide-Leg Trousers", price: 28.00, stock: 120, seed: "wmn3",
    specs: { fabric: "polyester blend", fit: "wide-leg" }, desc: "High-waisted pleated trousers with a flowing wide leg for a polished, comfortable silhouette." },

  // Men
  { sku: "MEN-001", category: "Men", name: "Cotton Oxford Shirt", price: 26.99, stock: 150, seed: "men1",
    specs: { fabric: "100% cotton", fit: "regular" }, desc: "A classic Oxford shirt in breathable cotton, built for the office or the weekend." },
  { sku: "MEN-002", category: "Men", name: "Tapered Jogger Pants", price: 22.50, stock: 160, seed: "men2",
    specs: { fabric: "cotton-poly blend", fit: "tapered" }, desc: "Tapered joggers with a soft brushed interior — built for comfort without losing shape." },
  { sku: "MEN-003", category: "Men", name: "Lightweight Bomber Jacket", price: 39.99, stock: 80, seed: "men3",
    specs: { fabric: "nylon shell", fit: "regular" }, desc: "A lightweight bomber with a water-resistant shell, ready for anything the day brings." },

  // Beauty
  { sku: "BTY-001", category: "Beauty", name: "Vitamin C Brightening Serum", price: 18.99, stock: 200, seed: "bty1",
    specs: { size: "30ml", skinType: "all" }, desc: "A brightening serum with stabilized vitamin C to even tone and add glow over time." },
  { sku: "BTY-002", category: "Beauty", name: "Matte Liquid Lipstick Set", price: 14.50, stock: 180, seed: "bty2",
    specs: { count: "6 shades", finish: "matte" }, desc: "Six long-wear matte shades in one set, from everyday nudes to statement reds." },
  { sku: "BTY-003", category: "Beauty", name: "Hydrating Clay Face Mask", price: 12.00, stock: 220, seed: "bty3",
    specs: { size: "100g", skinType: "combination" }, desc: "A mineral clay mask that draws out impurities while a hyaluronic blend keeps skin hydrated." },

  // Home & Living
  { sku: "HOM-001", category: "Home & Living", name: "Ceramic Pour-Over Coffee Set", price: 34.99, stock: 70, seed: "hom1",
    specs: { material: "ceramic", capacity: "500ml" }, desc: "A minimalist pour-over set for slowing down your morning coffee ritual." },
  { sku: "HOM-002", category: "Home & Living", name: "Linen Throw Pillow Cover (2-pack)", price: 19.99, stock: 130, seed: "hom2",
    specs: { material: "100% linen", size: "45x45cm" }, desc: "Two breathable linen covers that soften up any sofa or bed in one styling pass." },
  { sku: "HOM-003", category: "Home & Living", name: "Stackable Storage Bins (Set of 3)", price: 24.50, stock: 100, seed: "hom3",
    specs: { material: "woven fabric", sizes: "S/M/L" }, desc: "Collapsible, stackable bins that turn closet chaos into an actual system." },

  // Electronics
  { sku: "ELE-001", category: "Electronics", name: "Wireless Noise-Cancelling Earbuds", price: 59.99, stock: 110, seed: "ele1",
    specs: { battery: "30hr total", anc: "yes" }, desc: "Compact earbuds with active noise cancellation and a case that tops up on the go." },
  { sku: "ELE-002", category: "Electronics", name: "DevBook Pro 14 Laptop", price: 999.99, stock: 25, seed: "ele2",
    specs: { cpu: "8-core", ram: "16GB", storage: "512GB SSD" }, desc: "A 14-inch laptop built for developers, with a fast CPU and long battery life." },
  { sku: "ELE-003", category: "Electronics", name: "Fast-Charge Power Bank 10000mAh", price: 21.99, stock: 200, seed: "ele3",
    specs: { capacity: "10000mAh", ports: "USB-C + USB-A" }, desc: "Pocket-sized power bank with fast charging for phones, earbuds, and more." },

  // Kids
  { sku: "KID-001", category: "Kids", name: "Organic Cotton Bodysuit Set (5-pack)", price: 24.99, stock: 90, seed: "kid1",
    specs: { fabric: "organic cotton", sizes: "0-24m" }, desc: "Soft, breathable bodysuits made from certified organic cotton — five in every pack." },
  { sku: "KID-002", category: "Kids", name: "Wooden Building Blocks (50pc)", price: 27.50, stock: 75, seed: "kid2",
    specs: { material: "beechwood", pieces: "50" }, desc: "Smooth-sanded wooden blocks in a rainbow palette for open-ended building play." },
];

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "admin@shop.com" },
    update: { emailVerified: true },
    create: {
      email: "admin@shop.com",
      password: adminPassword,
      firstName: "Store",
      lastName: "Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categoryMap[cat.name] = created.id;
  }

  for (const p of PRODUCTS) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: p.desc,
        price: p.price,
        stock: p.stock,
        sku: p.sku,
        categoryId: categoryMap[p.category],
        specifications: p.specs,
        images: { create: [{ url: img(p.seed), position: 0 }] },
      },
    });
  }

  console.log(`✅ Seed complete: ${CATEGORIES.length} categories, ${PRODUCTS.length} products.`);
  console.log("   Admin login: admin@shop.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
