import mongoose from 'mongoose';

const connectDB = async () => {
  // Use MongoDB Atlas URI if provided, otherwise try local
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/voting-dapp';
  
  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Continuing without database persistence...');
    // Return null instead of exiting - app works without DB
    return null;
  }
};

export default connectDB;