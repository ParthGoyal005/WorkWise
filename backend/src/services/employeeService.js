const Employee = require('../models/Employee');
const { ApiError } = require('../utils/ApiError');

async function listEmployees() {
  return Employee.find().sort({ name: 1 });
}

async function getEmployee(id) {
  const employee = await Employee.findById(id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }
  return employee;
}

async function createEmployee(payload) {
  return Employee.create(payload);
}

async function updateEmployee(id, payload) {
  const allowed = [
    'name',
    'email',
    'department',
    'role',
    'employeeType',
    'casualLeavesTaken',
    'medicalLeavesTaken',
    'wfhDaysUsed',
    'isActive',
  ];

  const updates = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) {
      updates[key] = payload[key];
    }
  }

  const employee = await Employee.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }

  return employee;
}

async function deleteEmployee(id) {
  const employee = await Employee.findByIdAndDelete(id);
  if (!employee) {
    throw new ApiError(404, 'Employee not found.');
  }
  return { deleted: true };
}

module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
