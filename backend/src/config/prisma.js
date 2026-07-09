const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

// Prisma 7 requires an explicit driver adapter for the client (no more implicit
// connection via schema.prisma's datasource url).
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Reuse a single PrismaClient instance (important with nodemon / serverless reloads)
const prisma = global.__prisma || new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

module.exports = prisma;
