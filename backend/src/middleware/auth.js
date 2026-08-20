const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Requires a valid Bearer JWT. Attaches req.user (full user document without password).
 */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = header.slice(7).trim();
    if (!token) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Invalid or expired token. Please log in again.');
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, 'User account is inactive or does not exist.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
