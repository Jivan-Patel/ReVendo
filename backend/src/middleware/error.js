module.exports = function (err, req, res, next) {
  console.error("Unhandled Error:", err);
  res.status(500).send({
    error: "An unexpected server error occurred.",
    details: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};
