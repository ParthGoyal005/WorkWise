const { ApiError } = require('../utils/ApiError');

/**
 * Restricts a route to one or more roles.
 * Usage: authorize('admin') or authorize('admin', 'employee')
 */
function authorize(...allowedRoles) {
  return function roleGuard(req, _res, next) {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required.'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'You do not have permission to perform this action.')
      );
    }

    return next();
  };
}

module.exports = { authorize };
