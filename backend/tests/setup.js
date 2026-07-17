process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";


require("express-async-errors");
