const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "CHANGE_ME_BEFORE_SUBMISSION";

module.exports = function authenticateJWT(req, res, next) {
  const authHeader = req.headers["authorization"];

  // Check if the Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const err = new Error("Missing or malformed Authorization header");
    err.statusCode = 401;
    err.errorCategory = "AuthenticationError";
    return next(err);
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.split(" ")[1];

  try {
    // Verify the token and attach the decoded payload to req.user
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    // Handle expired or invalid tokens
    const authErr = new Error(
      err.name === "TokenExpiredError" ? "Token has expired" : "Invalid token"
    );
    authErr.statusCode = 401;
    authErr.errorCategory = "AuthenticationError";
    return next(authErr);
  }
};