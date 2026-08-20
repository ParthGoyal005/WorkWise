const mongoose = require('mongoose');
const { loadEnv } = require('./env');

async function connectDB() {
  const { mongodbUri, nodeEnv } = loadEnv();

  mongoose.set('strictQuery', true);

  await mongoose.connect(mongodbUri);

  if (nodeEnv !== 'test') {
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
  }
}

module.exports = { connectDB };
