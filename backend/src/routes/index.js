const express = require('express');
const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const aiRoutes = require('./aiRoutes');
const ruleRoutes = require('./ruleRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Enterprise Knowledge Assistant API is running.',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/ai', aiRoutes);
router.use('/rules', ruleRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
