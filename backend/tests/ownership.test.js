const request = require("supertest");

jest.mock("../src/config/prisma", () => require("./mocks/prisma"));
jest.mock("../src/services/openclawService");

const prisma = require("../src/config/prisma");
const cartRoutes = require("../src/routes/cartRoutes");
const addressRoutes = require("../src/routes/addressRoutes");
const aiRoutes = require("../src/routes/aiRoutes");
const { buildApp, makeToken } = require("./helpers/app");

const cartApp = buildApp("/api/cart", cartRoutes);
const addressApp = buildApp("/api/addresses", addressRoutes);
const aiApp = buildApp("/api/ai", aiRoutes);

const owner = { id: "user-a", email: "a@example.com", role: "CUSTOMER" };
const intruder = { id: "user-b", email: "b@example.com", role: "CUSTOMER" };
const ownerToken = makeToken(owner);
const intruderToken = makeToken(intruder);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("cart item ownership", () => {
  it("returns 404 when another user tries to update someone else's cart item", async () => {
    
    prisma.cartItem.findFirst.mockResolvedValue(null);

    const res = await request(cartApp)
      .put("/api/cart/items/item-owned-by-a")
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ quantity: 5 });

    expect(res.status).toBe(404);
    expect(prisma.cartItem.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "item-owned-by-a", userId: intruder.id } })
    );
    expect(prisma.cartItem.update).not.toHaveBeenCalled();
  });

  it("returns 404 when another user tries to delete someone else's cart item", async () => {
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(cartApp)
      .delete("/api/cart/items/item-owned-by-a")
      .set("Authorization", `Bearer ${intruderToken}`);

    expect(res.status).toBe(404);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { id: "item-owned-by-a", userId: intruder.id },
    });
  });

  it("allows the owner to update their own cart item quantity within stock", async () => {
    prisma.cartItem.findFirst.mockResolvedValue({
      id: "item-1",
      userId: owner.id,
      product: { stock: 10 },
    });
    prisma.cartItem.update.mockResolvedValue({ id: "item-1", quantity: 3 });

    const res = await request(cartApp)
      .put("/api/cart/items/item-1")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
  });

  it("rejects a quantity update that exceeds available stock", async () => {
    prisma.cartItem.findFirst.mockResolvedValue({
      id: "item-1",
      userId: owner.id,
      product: { stock: 2 },
    });

    const res = await request(cartApp)
      .put("/api/cart/items/item-1")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ quantity: 999 });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
  });
});

describe("address ownership", () => {
  it("returns 404 when another user tries to delete someone else's address", async () => {
    prisma.address.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(addressApp)
      .delete("/api/addresses/addr-owned-by-a")
      .set("Authorization", `Bearer ${intruderToken}`);

    expect(res.status).toBe(404);
    expect(prisma.address.deleteMany).toHaveBeenCalledWith({
      where: { id: "addr-owned-by-a", userId: intruder.id },
    });
  });

  it("allows the owner to delete their own address", async () => {
    prisma.address.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(addressApp)
      .delete("/api/addresses/addr-1")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(204);
  });
});

describe("AI conversation ownership", () => {
  it("returns 404 when another user tries to continue someone else's conversation", async () => {
  
    prisma.aiConversation.findFirst.mockResolvedValue(null);

    const res = await request(aiApp)
      .post("/api/ai/chat")
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ message: "hello", conversationId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(404);
    expect(prisma.aiConversation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "11111111-1111-1111-1111-111111111111", userId: intruder.id },
      })
    );
  });
});
