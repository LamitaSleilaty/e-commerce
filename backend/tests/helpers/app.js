const express = require("express");
require("express-async-errors");
const jwt = require("jsonwebtoken");
const errorHandler = require("../../src/middleware/errorHandler");

function buildApp(basePath, router) {
  const app = express();
  app.use(express.json());
  app.use(basePath, router);
  app.use(errorHandler);
  return app;
}

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role || "CUSTOMER" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

module.exports = { buildApp, makeToken };
