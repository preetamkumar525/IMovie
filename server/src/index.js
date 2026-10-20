const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSeatSocket } = require('./sockets/seatSocket');
const { startSeatCleanupJob } = require('./services/seatCleanupService');
const { syncMoviesAndShows } = require('./services/tmdbService');
const { seedInitialData } = require('./services/seedService');

// Routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

initSeatSocket(io);

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    appName: 'IMovies API',
    time: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start Server and Background Services
const startServer = async () => {
  try {
    // 1. Connect to Database (Atlas or automatic in-memory fallback)
    await connectDB();

    // 2. Seed default admin, demo user & catalog
    await seedInitialData();

    // 3. Start background seat hold cleanup (checks every 15s)
    startSeatCleanupJob(15000);

    // 4. Daily TMDB sync cron job (Runs at 00:00 midnight)
    cron.schedule('0 0 * * *', async () => {
      console.log('⏰ Running daily TMDB catalog sync cron job...');
      try {
        await syncMoviesAndShows();
      } catch (cronErr) {
        console.error('Error during daily TMDB cron sync:', cronErr.message);
      }
    });

    // 5. Start listening
    server.listen(PORT, () => {
      console.log(`🎬 IMovies Server running on port ${PORT}`);
      console.log(`🌐 Client expected at ${CLIENT_URL}`);
      console.log(`⚡ Real-time Socket.io initialized`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
