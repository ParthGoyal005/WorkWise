const { body } = require('express-validator');
const express = require('express');
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { ROLES, DEPARTMENTS, EMPLOYEE_TYPES } = require('../config/constants');

const router = express.Router();

const signupRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage('Role must be admin or employee'),
  body('department')
    .optional()
    .isIn(DEPARTMENTS)
    .withMessage('Invalid department'),
  body('employeeType')
    .optional()
    .isIn(EMPLOYEE_TYPES)
    .withMessage('Invalid employee type'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('A valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('department')
    .optional()
    .isIn(DEPARTMENTS)
    .withMessage('Invalid department'),
  body('employeeType')
    .optional()
    .isIn(EMPLOYEE_TYPES)
    .withMessage('Invalid employee type'),
];

router.post('/signup', signupRules, validate, authController.signup);
router.post('/login', loginRules, validate, authController.login);

router.get('/me', authenticate, authController.getMe);
router.patch(
  '/me',
  authenticate,
  updateProfileRules,
  validate,
  authController.updateMe
);

router.get(
  '/users',
  authenticate,
  authorize(ROLES.ADMIN),
  authController.listUsers
);

module.exports = router;
