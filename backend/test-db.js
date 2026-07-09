const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/escapeXpert';

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully!');
    console.log('Database:', mongoose.connection.name);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
    await mongoose.disconnect();
    console.log('Disconnected');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();