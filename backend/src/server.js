const { createApp } = require('./app');
const { connectDB } = require('./config/db');
const { loadEnv } = require('./config/env');

async function start() {
  try {
    const env = loadEnv();
    await connectDB();

    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Server running on http://localhost:${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
