function model() {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    upsert: jest.fn(),
    count: jest.fn(),
  };
}

const prisma = {
  user: model(),
  address: model(),
  product: model(),
  cartItem: model(),
  order: model(),
  orderItem: model(),
  review: model(),
  favorite: model(),
  browsingEvent: model(),
  aiConversation: model(),
  aiMessage: model(),
  $transaction: jest.fn(async (fn) => fn(prisma)),
};

module.exports = prisma;
