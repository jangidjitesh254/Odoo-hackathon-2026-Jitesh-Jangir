import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes mounting
app.use('/api/auth', authRoutes);

// Unhandled Endpoint Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
});

// Error handling middleware (must be registered last)
app.use(errorHandler);

// Initialize DB and start server
async function startServer() {
  try {
    console.log('Initializing database...');
    await initDb();
    
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(` AssetFlow Backend Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Health check: http://localhost:${PORT}/health`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error('Failed to initialize database or start server:', error);
    process.exit(1);
  }
}

startServer();
