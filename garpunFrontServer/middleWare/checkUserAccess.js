const createError = require('http-errors');

const onlyAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.userRole === process.env.USER_ADMIN) {
    return next();
  }
  return next(createError(401));
};

const onlyAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  return next(createError(401));
};

module.exports = {
  onlyAdmin,
  onlyAuthenticated,
};
