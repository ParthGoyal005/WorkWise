const express = require('express');
const { body, param, query } = require('express-validator');
const documentController = require('../controllers/documentController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');
const { validate } = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const {ROLES,DEPARTMENTS,DOCUMENT_CATEGORIES,ACCESS_TYPES,} = require('../config/constants');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  [
    query('department').optional().isIn(DEPARTMENTS),
    query('category').optional().isIn(DOCUMENT_CATEGORIES),
  ],
  validate,
  documentController.listDocuments
);

router.get(
  '/search',
  [query('q').trim().notEmpty().withMessage('Search query is required')],
  validate,
  documentController.searchDocuments
);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid document id')],
  validate,
  documentController.getDocument
);

router.post(
  '/upload',
  authorize(ROLES.ADMIN),
  upload.single('file'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 255 }),
    body('department').optional().isIn(DEPARTMENTS),
    body('category').optional().isIn(DOCUMENT_CATEGORIES),
    body('accessType').optional().isIn(Object.values(ACCESS_TYPES)),
  ],
  validate,
  documentController.uploadDocument
);

router.patch(
  '/:id/permissions',
  authorize(ROLES.ADMIN),
  [
    param('id').isMongoId().withMessage('Invalid document id'),
    body('accessType')
      .isIn(Object.values(ACCESS_TYPES))
      .withMessage('Invalid access type'),
  ],
  validate,
  documentController.updatePermissions
);

router.delete(
  '/:id',
  authorize(ROLES.ADMIN),
  [param('id').isMongoId().withMessage('Invalid document id')],
  validate,
  documentController.deleteDocument
);

module.exports = router;
