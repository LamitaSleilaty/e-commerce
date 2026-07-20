const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { z } = require("zod");
const prisma = require("../config/prisma");
const email = require("../services/emailService");

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const resendSchema = z.object({
  email: z.string().email(),
});

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

function sendVerificationEmail(user, token) {
  const verificationUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email?token=${token}`;
  email.sendEmail({
    to: user.email,
    subject: "Verify your email",
    html: `
      <p>Hi ${user.firstName},</p>
      <p>Click the link below to verify your email and activate your account:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

const REGISTER_MESSAGE =
  "Registration received. Check your email to verify your account before logging in.";

async function register(req, res) {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return res.status(201).json({ message: REGISTER_MESSAGE });
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const verificationToken = crypto.randomBytes(32).toString("hex");
  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashed,
      verificationToken,
      verificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS),
    },
  });

  sendVerificationEmail(user, verificationToken);

  res.status(201).json({ message: REGISTER_MESSAGE });
}

async function login(req, res) {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) return res.status(401).json({ error: "Invalid email or password" });

  if (!user.emailVerified) {
    return res.status(403).json({
      error: "Please verify your email before logging in.",
      code: "EMAIL_NOT_VERIFIED",
    });
  }

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
}

async function verifyEmail(req, res) {
  const token = z.string().min(1).parse(req.query.token);

  const user = await prisma.user.findFirst({
    where: { verificationToken: token, verificationExpires: { gt: new Date() } },
  });
  if (!user) return res.status(400).json({ error: "Invalid or expired verification link." });

  const verified = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null, verificationExpires: null },
  });

  const jwtToken = signToken(verified);
  res.json({ token: jwtToken, user: publicUser(verified) });
}

async function resendVerification(req, res) {
  const { email } = resendSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS) },
    });
    sendVerificationEmail(updated, verificationToken);
  }

  res.json({ message: "If that email exists and isn't verified yet, we've sent a new verification link." });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  res.json({ user });
}

module.exports = { register, login, me, verifyEmail, resendVerification };
