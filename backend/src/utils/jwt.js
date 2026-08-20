const jwt = require('jsonwebtoken');
const { loadEnv } = require('../config/env');

function signToken(payload) {
  const { jwtSecret, jwtExpiresIn } = loadEnv();
  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

function verifyToken(token) {
  const { jwtSecret } = loadEnv();
  return jwt.verify(token, jwtSecret);
}

module.exports = { signToken, verifyToken };
