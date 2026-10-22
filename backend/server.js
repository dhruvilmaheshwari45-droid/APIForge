import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';

// Load environment variables
dotenv.config();

import { connectDB } from './config/db.js';
import logger from './utils/logger.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import collectionRoutes from './routes/collectionRoutes.js';
import apiRoutes from './routes/apiRoutes.js';
import mockServerRoutes from './routes/mockServerRoutes.js';
import mockRuleRoutes from './routes/mockRuleRoutes.js';
import environmentRoutes from './routes/environmentRoutes.js';
import testRoutes from './routes/testRoutes.js';
import testRunRoutes from './routes/testRunRoutes.js';
import trafficRoutes from './routes/trafficRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import versionRoutes from './routes/versionRoutes.js';

const app = express();
const server = http.createServer(app);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive CORS
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Socket.io initialization for traffic telemetry
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    platform: 'APIForge Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/apis', apiRoutes);
app.use('/api/mock-servers', mockServerRoutes);
app.use('/api/mock-rules', mockRuleRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/test-runs', testRunRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/versions', versionRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start listening
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`APIForge Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      logger.info(`Socket.io telemetry server listening on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
