const isAdmin = require("./isAdmin");
const ownsResource = require("./ownsResource");

module.exports = function canViewMail(user, mail) {
  return isAdmin(user) || ownsResource(user, mail);
};