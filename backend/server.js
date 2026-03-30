const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Allow multiple origins for CORS (local + production)
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);

const userSockets = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_order_room', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    userSockets.set(userId.toString(), socket.id);
    console.log(`User ${userId} joined room`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) { userSockets.delete(userId); break; }
    }
  });
});

// CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check — Render pings this to keep the service alive
app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  message: 'D5 API running',
  version: '3.0.0',
  timestamp: new Date().toISOString()
}));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/services',      require('./routes/services'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/facilities',    require('./routes/facilities'));
app.use('/api/payment',       require('./routes/payment'));
app.use('/api/wallet',        require('./routes/wallet'));
app.use('/api/reviews',       require('./routes/reviews'));
app.use('/api/notifications', require('./routes/notifications'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// Connect to MongoDB then start server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ D5 Server running on port ${PORT}`);
      console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
