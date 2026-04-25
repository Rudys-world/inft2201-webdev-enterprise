// Returns true if mail.userId matches user.userId.

module.exports = function ownsResource(user, mail) {
  return user && mail && mail.userId === user.userId;
};