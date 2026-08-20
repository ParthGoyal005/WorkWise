const User = require('../models/User');
const Employee = require('../models/Employee');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const { ApiError } = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

function buildAuthResponse(user) {
  const token = signToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      employeeType: user.employeeType,
      createdAt: user.createdAt,
    },
  };
}

async function signup({ name, email, password, role, department, employeeType }) {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists.');
  }

  // Only allow admin role if no admin exists yet (bootstrap), otherwise force employee
  let assignedRole = ROLES.EMPLOYEE;
  if (role === ROLES.ADMIN) {
    const adminCount = await User.countDocuments({ role: ROLES.ADMIN });
    if (adminCount === 0) {
      assignedRole = ROLES.ADMIN;
    }
  }

  const hashed = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
    role: assignedRole,
    department: department || 'General',
    employeeType: employeeType || 'Permanent',
  });

  // Keep an Employee record in sync for rule-engine demos
  if (assignedRole === ROLES.EMPLOYEE) {
    const code = `EMP${Date.now().toString().slice(-6)}`;
    await Employee.create({
      userId: user._id,
      employeeCode: code,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      employeeType: user.employeeType,
    });
  }

  return buildAuthResponse(user);
}

async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    '+password'
  );

  if (!user) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated.');
  }

  const match = await comparePassword(password, user.password);
  if (!match) {
    throw new ApiError(401, 'Invalid email or password.');
  }

  return buildAuthResponse(user);
}

async function getProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }
  return user;
}

async function updateProfile(userId, updates) {
  const allowed = ['name', 'department', 'employeeType'];
  const payload = {};

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }

  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (user.role === ROLES.EMPLOYEE) {
    await Employee.findOneAndUpdate(
      { userId: user._id },
      {
        name: user.name,
        department: user.department,
        employeeType: user.employeeType,
      }
    );
  }

  return user;
}

async function listUsers() {
  return User.find().sort({ createdAt: -1 });
}

module.exports = {
  signup,
  login,
  getProfile,
  updateProfile,
  listUsers,
};
