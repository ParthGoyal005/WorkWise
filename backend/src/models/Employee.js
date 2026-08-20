const mongoose = require('mongoose');
const { DEPARTMENTS, EMPLOYEE_TYPES, ROLES } = require('../config/constants');

/**
 * Sample / managed employee records used by the Rule Engine.
 * Can be linked to a User account via userId.
 */
const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    employeeCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    department: {
      type: String,
      enum: DEPARTMENTS,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE,
    },
    employeeType: {
      type: String,
      enum: EMPLOYEE_TYPES,
      default: 'Permanent',
    },
    casualLeavesTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    medicalLeavesTaken: {
      type: Number,
      default: 0,
      min: 0,
    },
    wfhDaysUsed: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1 });
employeeSchema.index({ email: 1 });

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;
