import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import proposalRoutes from './routes/proposals.js';
import userRoutes from './routes/users.js';
import syncRoutes from './routes/sync.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use('/api/proposals', proposalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sync', syncRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const startServer = async () => {
  // Try to connect to DB but don't fail if unavailable
  await connectDB();
  
  // Initialize blockchain service
  try {
    const { default: blockchainService } = await import('./services/blockchainService.js');
    console.log('✅ Blockchain service initialized');
  } catch (error) {
    console.error('⚠️  Blockchain service error:', error.message);
  }
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📄 API Documentation: http://localhost:${PORT}/health`);
    console.log(`⛓️  Contract: ${process.env.CONTRACT_ADDRESS || '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442'}`);
  });
};

startServer();