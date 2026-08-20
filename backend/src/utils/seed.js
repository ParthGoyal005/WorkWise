/**
 * Seeds an initial admin, sample employees, and starter business rules.
 * Run: npm run seed
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Rule = require('../models/Rule');
const { hashPassword } = require('./password');
const { ROLES, RULE_ACTIONS } = require('../config/constants');

async function seed() {
  await connectDB();

  const adminEmail = 'admin@company.com';
  let admin = await User.findOne({ email: adminEmail });

  if (!admin) {
    admin = await User.create({
      name: 'System Admin',
      email: adminEmail,
      password: await hashPassword('admin123'),
      role: ROLES.ADMIN,
      department: 'HR',
      employeeType: 'Permanent',
    });
    console.log('Created admin: admin@company.com / admin123');
  } else {
    console.log('Admin already exists, skipping.');
  }

  const samples = [
    {
      name: 'Priya Sharma',
      email: 'priya@company.com',
      department: 'Engineering',
      employeeType: 'Permanent',
      casualLeavesTaken: 4,
      medicalLeavesTaken: 1,
      wfhDaysUsed: 8,
      code: 'EMP1001',
    },
    {
      name: 'Rahul Mehta',
      email: 'rahul@company.com',
      department: 'Finance',
      employeeType: 'Probation',
      casualLeavesTaken: 2,
      medicalLeavesTaken: 0,
      wfhDaysUsed: 3,
      code: 'EMP1002',
    },
    {
      name: 'Ananya Iyer',
      email: 'ananya@company.com',
      department: 'HR',
      employeeType: 'Permanent',
      casualLeavesTaken: 10,
      medicalLeavesTaken: 2,
      wfhDaysUsed: 5,
      code: 'EMP1003',
    },
  ];

  for (const sample of samples) {
    let user = await User.findOne({ email: sample.email });
    if (!user) {
      user = await User.create({
        name: sample.name,
        email: sample.email,
        password: await hashPassword('employee123'),
        role: ROLES.EMPLOYEE,
        department: sample.department,
        employeeType: sample.employeeType,
      });
      console.log(`Created employee user: ${sample.email} / employee123`);
    }

    const existingEmp = await Employee.findOne({ employeeCode: sample.code });
    if (!existingEmp) {
      await Employee.create({
        userId: user._id,
        employeeCode: sample.code,
        name: sample.name,
        email: sample.email,
        department: sample.department,
        role: ROLES.EMPLOYEE,
        employeeType: sample.employeeType,
        casualLeavesTaken: sample.casualLeavesTaken,
        medicalLeavesTaken: sample.medicalLeavesTaken,
        wfhDaysUsed: sample.wfhDaysUsed,
      });
      console.log(`Created employee record: ${sample.code}`);
    }
  }

  const ruleCount = await Rule.countDocuments();
  if (ruleCount === 0) {
    await Rule.insertMany([
      {
        name: 'Maximum Casual Leave',
        description: 'Reject when casual leaves taken plus requested exceeds 12.',
        logic: 'AND',
        conditions: [
          { field: 'leavesTakenPlusRequested', operator: '>', value: 12 },
        ],
        action: RULE_ACTIONS.REJECT,
        isActive: true,
        priority: 10,
        createdBy: admin._id,
      },
      {
        name: 'Probation Leave Cap',
        description: 'Probation employees cannot request more than 5 leaves at once.',
        logic: 'AND',
        conditions: [
          { field: 'employeeType', operator: '==', value: 'Probation' },
          { field: 'requestedLeaves', operator: '>', value: 5 },
        ],
        action: RULE_ACTIONS.REJECT,
        isActive: true,
        priority: 20,
        createdBy: admin._id,
      },
      {
        name: 'Large Leave Manual Review',
        description: 'Requests above 7 days need manual HR review.',
        logic: 'AND',
        conditions: [{ field: 'requestedLeaves', operator: '>', value: 7 }],
        action: RULE_ACTIONS.MANUAL_REVIEW,
        isActive: true,
        priority: 30,
        createdBy: admin._id,
      },
    ]);
    console.log('Created sample business rules.');
  }

  await mongoose.disconnect();
  console.log('Seed complete.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
