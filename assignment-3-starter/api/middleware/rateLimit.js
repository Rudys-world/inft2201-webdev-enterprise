// Simple fixed-window in-memory rate limiter
const store = new Map(); // key -> { count, windowStart }

const MAX = parseInt(process.env.RATE_LIMIT_MAX, 10) || 5;
const WINDOW_MS = (parseInt(process.env.RATE_LIMIT_WINDOW_SECONDS, 10) || 60) * 1000;

module.exports = function rateLimit(req, res, next) {
  // Use userId if authenticated, otherwise fall back to IP
  const key = req.user ? `user:${req.user.userId}` : `ip:${req.ip}`;
  const now = Date.now();

  let record = store.get(key);

  // Reset window if expired or first request
  if (!record || now - record.windowStart >= WINDOW_MS) {
    record = { count: 0, windowStart: now };
  }

  record.count++;
  store.set(key, record);

  if (record.count > MAX) {
    const retryAfter = Math.ceil((record.windowStart + WINDOW_MS - now) / 1000);
    const err = new Error("Rate limit exceeded. Please slow down.");
    err.statusCode = 429;
    err.errorCategory = "RateLimitError";
    err.retryAfter = retryAfter;
    return next(err);
  }

  next();
};