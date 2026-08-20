const express = require('express');
const cors = require('cors');
const path = require('path');
const { loadEnv } = require('./config/env');
const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const { clientUrl, uploadDir } = loadEnv();
  const app = express();

  app.use(
    cors({
      origin: clientUrl,
      credentials: true,
    })
  );// helps fronted to talk to backend
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(
    '/uploads',
    express.static(path.join(__dirname, '..', uploadDir))
  );

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      message: 'Enterprise Knowledge Assistant API',
      docs: {
        health: '/api/health',
        auth: {
          signup: 'POST /api/auth/signup',
          login: 'POST /api/auth/login',
          me: 'GET /api/auth/me',
        },
        frontend: clientUrl,
      },
    });
  });

  app.use('/api', apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
