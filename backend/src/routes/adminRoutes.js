const express = require('express');
const { body, param } = require('express-validator');
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { ROLES, DEPARTMENTS, EMPLOYEE_TYPES } = require('../config/constants');

const router = express.Router();

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/analytics', adminController.getAnalytics);

router.get('/employees', adminController.listEmployees);

router.post(
  '/employees',
  [
    body('employeeCode').trim().notEmpty(),
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('department').isIn(DEPARTMENTS),
    body('employeeType').optional().isIn(EMPLOYEE_TYPES),
  ],
  validate,
  adminController.createEmployee
);

router.patch(
  '/employees/:id',
  [param('id').isMongoId()],
  validate,
  adminController.updateEmployee
);

router.delete(
  '/employees/:id',
  [param('id').isMongoId()],
  validate,
  adminController.deleteEmployee
);

module.exports = router;
