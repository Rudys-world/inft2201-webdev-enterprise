const express = require("express");
const jwt = require("jsonwebtoken");
const users = require("../data/users");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "CHANGE_ME_BEFORE_SUBMISSION";

// POST /auth/login
// Body: { username, password }
// On success: return a signed JWT containing { userId, role }
router.post("/login", (req, res, next) => {
  const { username, password } = req.body;

  // Find the user in our in-memory users list
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  // If no user found, credentials are invalid
  if (!user) {
    const err = new Error("Invalid username or password");
    err.statusCode = 401;
    return next(err);
  }

  // Sign a JWT with userId and role as claims
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    SECRET,
    { expiresIn: "1h" }
  );

  // Return the token to the client
  return res.json({ token });
});

module.exports = router;