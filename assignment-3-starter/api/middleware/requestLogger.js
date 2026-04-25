const { v4: uuidv4 } = require("uuid");

module.exports = function requestLogger(req, res, next) {
  // Generate a unique ID for this request
  req.requestId = uuidv4();

  // Log the request
  console.log(`REQUEST ${req.requestId} ${req.method} ${req.path}`);

  next();
};