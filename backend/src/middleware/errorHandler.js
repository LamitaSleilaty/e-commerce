
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === "P2002") {
    
    return res.status(409).json({ error: `Duplicate value for field: ${err.meta?.target}` });
  }
  if (err.code === "P2025") {
    
    return res.status(404).json({ error: "Record not found" });
  }
  if (err.name === "ZodError") {
    return res.status(400).json({ error: "Validation failed", details: err.errors });
  }

  const status = err.status || 500;
  const message = status === 500 ? "Internal server error" : err.message || "Internal server error";
  res.status(status).json({ error: message });
}

module.exports = errorHandler;
