process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-key";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";


require("express-async-errors");
