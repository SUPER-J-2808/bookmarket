const notFound = (_req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (error, _req, res, _next) => {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    message: error.message || "Server error"
  });
};

module.exports = { notFound, errorHandler };
