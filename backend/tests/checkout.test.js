const request = require("supertest");

jest.mock("../src/config/prisma", () => require("./mocks/prisma"));
jest.mock("../src/services/n8nService");

const prisma = require("../src/config/prisma");
const orderRoutes = require("../src/routes/orderRoutes");
const { buildApp, makeToken } = require("./helpers/app");

const app = buildApp("/api/orders", orderRoutes);
const user = { id: "user-1", email: "buyer@example.com", role: "CUSTOMER" };
const token = makeToken(user);

function cartItem(productId, price, quantity, stock, name = "Product") {
  return {
    id: `cart-${productId}`,
    userId: user.id,
    productId,
    quantity,
    product: { id: productId, name, price, stock },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
  prisma.product.findUnique.mockResolvedValue({ stock: 50 });
});

describe("POST /api/orders/checkout", () => {
  it("computes subtotal, tax, and shipping correctly", async () => {
    prisma.cartItem.findMany.mockResolvedValue([
      cartItem("p1", 10.0, 2, 50), // 20.00
      cartItem("p2", 25.0, 1, 50), // 25.00
    ]);
    prisma.address.findFirst.mockResolvedValue({ id: "addr-1", userId: user.id });
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "order-1",
        orderNumber: data.orderNumber,
        subtotal: data.subtotal,
        tax: data.tax,
        shippingFee: data.shippingFee,
        total: data.total,
        items: data.items.create.map((i, idx) => ({ id: `item-${idx}`, ...i })),
      })
    );
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 2 });

    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ addressId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(201);
    expect(Number(res.body.order.subtotal)).toBeCloseTo(45.0, 2);
    expect(Number(res.body.order.tax)).toBeCloseTo(3.6, 2); // 8% of 45.00
    expect(Number(res.body.order.shippingFee)).toBeCloseTo(9.99, 2); // under $100
    expect(Number(res.body.order.total)).toBeCloseTo(58.59, 2);
  });

  it("waives shipping when subtotal exceeds $100", async () => {
    prisma.cartItem.findMany.mockResolvedValue([cartItem("p1", 150.0, 1, 50)]);
    prisma.address.findFirst.mockResolvedValue({ id: "addr-1", userId: user.id });
    prisma.product.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.create.mockImplementation(({ data }) =>
      Promise.resolve({
        id: "order-1",
        orderNumber: data.orderNumber,
        subtotal: data.subtotal,
        tax: data.tax,
        shippingFee: data.shippingFee,
        total: data.total,
        items: data.items.create.map((i, idx) => ({ id: `item-${idx}`, ...i })),
      })
    );
    prisma.cartItem.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ addressId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(201);
    expect(Number(res.body.order.shippingFee)).toBe(0);
  });

  it("rejects checkout when the cart is empty", async () => {
    prisma.cartItem.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ addressId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  it("rejects checkout when the address does not belong to the requesting user", async () => {
    prisma.cartItem.findMany.mockResolvedValue([cartItem("p1", 10, 1, 50)]);
    prisma.address.findFirst.mockResolvedValue(null); // someone else's address

    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ addressId: "22222222-2222-2222-2222-222222222222" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/address/i);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it("rejects checkout and creates no order when stock is insufficient at commit time", async () => {
    prisma.cartItem.findMany.mockResolvedValue([cartItem("p1", 10, 5, 50, "Last Item")]);
    prisma.address.findFirst.mockResolvedValue({ id: "addr-1", userId: user.id });
    // simulates the race: another checkout already consumed the stock
    prisma.product.updateMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ addressId: "11111111-1111-1111-1111-111111111111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/insufficient stock/i);
    expect(prisma.order.create).not.toHaveBeenCalled();
  });
});
