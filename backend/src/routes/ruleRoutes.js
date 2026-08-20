const express = require('express');
const { body, param } = require('express-validator');
const ruleController = require('../controllers/ruleController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { ROLES, RULE_ACTIONS } = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get('/', ruleController.listRules);

router.post(
  '/evaluate',
  [
    body('casualLeavesTaken').isNumeric(),
    body('requestedLeaves').isNumeric(),
    body('employeeType').notEmpty(),
    body('department').notEmpty(),
  ],
  validate,
  ruleController.evaluate
);

router.post(
  '/evaluate/employee/:employeeId',
  [
    param('employeeId').isMongoId(),
    body('requestedLeaves').isNumeric(),
  ],
  validate,
  ruleController.evaluateEmployee
);

router.post(
  '/draft',
  [body('naturalLanguage').trim().notEmpty()],
  validate,
  authorize(ROLES.ADMIN),
  ruleController.draftRule
);

router.post(
  '/',
  authorize(ROLES.ADMIN),
  [
    body('name').trim().notEmpty(),
    body('action').isIn(Object.values(RULE_ACTIONS)),
    body('conditions').isArray({ min: 1 }),
  ],
  validate,
  ruleController.createRule
);

router.patch(
  '/:id',
  authorize(ROLES.ADMIN),
  [param('id').isMongoId()],
  validate,
  ruleController.updateRule
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  [param('id').isMongoId()],
  validate,
  ruleController.deleteRule
);

module.exports = router;
