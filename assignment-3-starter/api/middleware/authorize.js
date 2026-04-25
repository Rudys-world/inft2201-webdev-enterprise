module.exports = function authorize(policy) {
  return (req, res, next) => {
    const user = req.user;
    const mail = req.mail;

    if (policy(user, mail)) {
      return next();
    }

    const err = new Error("You do not have permission to access this resource");
    err.statusCode = 403;
    err.errorCategory = "ForbiddenError";
    return next(err);
  };
};