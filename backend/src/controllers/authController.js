const authService = require('../services/authService');
const { asyncHandler } = require('../utils/asyncHandler');

const signup = asyncHandler(async (req, res) => {
  const result = await authService.signup(req.body);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: result,
  });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    data: result,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.status(200).json({
    success: true,
    data: { user },
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await authService.updateProfile(req.user._id, req.body);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user },
  });
});

const listUsers = asyncHandler(async (_req, res) => {
  const users = await authService.listUsers();
  res.status(200).json({
    success: true,
    data: { users, count: users.length },
  });
});

module.exports = {
  signup,
  login,
  getMe,
  updateMe,
  listUsers,
};
