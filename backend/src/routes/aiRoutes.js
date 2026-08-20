const express = require('express');
const { body, param, query } = require('express-validator');
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(authenticate);

router.post(
  '/ask',
  [body('question').trim().notEmpty().withMessage('Question is required')],
  validate,
  aiController.ask
);

router.get(
  '/search',
  [query('q').trim().notEmpty().withMessage('Query is required')],
  validate,
  aiController.semanticSearch
);

router.get('/chats', aiController.listChats);

router.get(
  '/chats/:id',
  [param('id').isMongoId()],
  validate,
  aiController.getChat
);

router.post(
  '/documents/:id/summary',
  [param('id').isMongoId()],
  validate,
  aiController.generateSummary
);

router.post(
  '/compare',
  [
    body('documentIdA').isMongoId().withMessage('documentIdA is required'),
    body('documentIdB').isMongoId().withMessage('documentIdB is required'),
  ],
  validate,
  aiController.compareDocuments
);

module.exports = router;
