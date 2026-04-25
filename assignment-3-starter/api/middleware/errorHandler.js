module.exports = function errorHandler(err, req, res, next) {
  // Log the error with the requestId for tracing
  console.error(`Unhandled error for request ${req.requestId || "unknown"}:`, err.message);

  // Use statusCode from the error object if available, otherwise default to 500
  const statusCode = err.statusCode || 500;

  // Map statusCode to a clean error category
  let errorCategory = err.errorCategory || "InternalServerError";

  // Safe message — never expose stack traces
  let message = err.message || "An unexpected error occurred.";

  // For unexpected 500 errors, hide internal details from client
  if (statusCode === 500) {
    errorCategory = "InternalServerError";
    message = "An unexpected error occurred.";
  }

    // Attach Retry-After header if present (for rate limiting)
  if (err.retryAfter) {
    res.set("Retry-After", err.retryAfter.toString());
  }

  const responseBody = {
    error: errorCategory,
    message: message,
    statusCode: statusCode,
    requestId: req.requestId || null,
    timestamp: new Date().toISOString()
  };

  // Include retryAfter in JSON for 429 responses
  if (err.retryAfter) {
    responseBody.retryAfter = err.retryAfter;
  }

  return res.status(statusCode).json(responseBody);
};