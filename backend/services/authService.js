const jwt = require('jsonwebtoken');

const buildTokenPayload = (entity, role) => ({
  id: entity._id,
  role,
  tokenVersion: entity.tokenVersion || 0,
});

const signToken = (entity, role) => jwt.sign(
  buildTokenPayload(entity, role),
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '12h' }
);

const buildSessionResponse = ({ entity, role, token, extra = {} }) => ({
  success: true,
  token,
  tokenType: 'Bearer',
  expiresIn: process.env.JWT_EXPIRE || process.env.JWT_EXPIRES_IN || '12h',
  ...extra,
  [role === 'admin' ? 'admin' : role === 'worker' ? 'worker' : 'user']: entity,
});

module.exports = { signToken, buildSessionResponse };
