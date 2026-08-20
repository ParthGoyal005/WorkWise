const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/ApiError');

/**
 * Runs after express-validator checks.
 * Returns 400 with field-level errors if validation failed.
 */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(new ApiError(400, 'Validation failed', details));
  }
  return next();
}

module.exports = { validate };
