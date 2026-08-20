const employeeService = require('../services/employeeService');
const analyticsService = require('../services/analyticsService');
const { asyncHandler } = require('../utils/asyncHandler');

const listEmployees = asyncHandler(async (_req, res) => {
  const employees = await employeeService.listEmployees();
  res.json({ success: true, data: { employees, count: employees.length } });
});

const createEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.createEmployee(req.body);
  res.status(201).json({
    success: true,
    message: 'Employee created.',
    data: { employee },
  });
});

const updateEmployee = asyncHandler(async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  res.json({
    success: true,
    message: 'Employee updated.',
    data: { employee },
  });
});

const deleteEmployee = asyncHandler(async (req, res) => {
  await employeeService.deleteEmployee(req.params.id);
  res.json({ success: true, message: 'Employee deleted.' });
});

const getAnalytics = asyncHandler(async (_req, res) => {
  const analytics = await analyticsService.getAnalytics();
  res.json({ success: true, data: { analytics } });
});

module.exports = {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getAnalytics,
};
