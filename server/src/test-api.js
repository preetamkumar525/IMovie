const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const { io: ClientIo } = require('../../client/node_modules/socket.io-client');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSeatSocket } = require('./sockets/seatSocket');
const { seedInitialData } = require('./services/seedService');

// Routes
const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
initSeatSocket(io);

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/shows', showRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

const TEST_PORT = 5055;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const runTests = async () => {
  console.log('🧪 Starting Full IMovies API & Socket Test Suite...');

  await connectDB();
  await seedInitialData();

  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`🚀 Test server listening on ${TEST_PORT}`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, title) => {
    if (condition) {
      console.log(`  ✅ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${title}`);
      failed++;
    }
  };

  try {
    // 1. Health check
    const health = await axios.get(`${BASE_URL}/health`);
    assert(health.status === 200 && health.data.status === 'ok', 'GET /api/health');

    // 2. Auth: Admin login
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@imovies.com',
      password: 'admin123',
    });
    const adminToken = adminLogin.data.token;
    assert(adminLogin.data.success && adminToken, 'POST /api/auth/login (Admin)');

    // 3. Auth: Signup regular user
    const testEmail = `tester_${Date.now()}@example.com`;
    const signupRes = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Test Viewer',
      email: testEmail,
      password: 'password123',
    });
    const userToken = signupRes.data.token;
    assert(signupRes.data.success && userToken, 'POST /api/auth/signup (User)');

    // 4. Auth: Get me
    const meRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(meRes.data.user.email === testEmail, 'GET /api/auth/me');

    // 5. Movies: Get all movies
    const moviesRes = await axios.get(`${BASE_URL}/movies`);
    assert(moviesRes.data.success && moviesRes.data.data.length > 0, `GET /api/movies (${moviesRes.data.data.length} movies)`);
    const testMovie = moviesRes.data.data[0];

    // 6. Movies: Search and genre filter
    const searchRes = await axios.get(`${BASE_URL}/movies`, {
      params: { search: testMovie.title.slice(0, 4) },
    });
    assert(searchRes.data.data.some((m) => m._id === testMovie._id), 'GET /api/movies (search query)');

    // 7. Movies: Get single movie
    const singleMovieRes = await axios.get(`${BASE_URL}/movies/${testMovie._id}`);
    assert(singleMovieRes.data.data.title === testMovie.title, 'GET /api/movies/:id');

    // 8. Movies: Get shows for movie
    const showsRes = await axios.get(`${BASE_URL}/movies/${testMovie._id}/shows`);
    assert(showsRes.data.success && showsRes.data.data.length > 0, `GET /api/movies/:id/shows (${showsRes.data.data.length} shows)`);
    const testShow = showsRes.data.data[0];

    // 9. Socket.io test connection & room join
    const socketClient = ClientIo(`http://localhost:${TEST_PORT}`, { transports: ['websocket'] });
    let socketReceivedUpdate = null;
    await new Promise((resolve) => {
      socketClient.on('connect', () => {
        socketClient.emit('joinShow', testShow._id);
        socketClient.on('seatUpdate', (data) => {
          socketReceivedUpdate = data;
        });
        resolve();
      });
    });
    assert(socketClient.connected, 'Socket.io client connected and joined show room');

    // 10. Shows: Get show seats
    const seatsRes = await axios.get(`${BASE_URL}/shows/${testShow._id}/seats`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(seatsRes.data.success && seatsRes.data.data.seats.length > 0, 'GET /api/shows/:id/seats');

    // 11. Shows: Hold seats (Row A, seats 1 and 2)
    const holdRes = await axios.post(
      `${BASE_URL}/shows/${testShow._id}/hold`,
      { seats: [{ row: 'A', number: 1 }, { row: 'A', number: 2 }] },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(holdRes.data.success && holdRes.data.seats.length === 2, 'POST /api/shows/:id/hold (5-min hold)');

    // Allow socket event to arrive
    await new Promise((r) => setTimeout(r, 200));
    assert(socketReceivedUpdate && socketReceivedUpdate.eventType === 'held', 'Socket.io received real-time "held" broadcast');

    // 12. Atomic double-hold prevention: Another user tries to hold seat A1
    const anotherEmail = `second_${Date.now()}@example.com`;
    const secondUser = await axios.post(`${BASE_URL}/auth/signup`, {
      name: 'Second User',
      email: anotherEmail,
      password: 'password123',
    });
    let doubleHoldRejected = false;
    try {
      await axios.post(
        `${BASE_URL}/shows/${testShow._id}/hold`,
        { seats: [{ row: 'A', number: 1 }] },
        { headers: { Authorization: `Bearer ${secondUser.data.token}` } }
      );
    } catch (err) {
      doubleHoldRejected = err.response?.status === 409;
    }
    assert(doubleHoldRejected, 'Atomic check: Rejected concurrent hold on already held seat (409)');

    // 13. Bookings: Confirm held seats after mock payment
    const bookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        showId: testShow._id,
        seats: [{ row: 'A', number: 1 }, { row: 'A', number: 2 }],
        paymentDetails: { method: 'Credit/Debit Card', transactionId: 'TXN-TEST-123' },
      },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(bookingRes.data.success && bookingRes.data.data.bookingId, 'POST /api/bookings (Confirmed with unique bookingId)');
    const testBooking = bookingRes.data.data;

    // Allow socket event to arrive
    await new Promise((r) => setTimeout(r, 200));
    assert(socketReceivedUpdate && socketReceivedUpdate.eventType === 'booked', 'Socket.io received real-time "booked" broadcast');

    // 14. Double booking prevention: Attempting to book already booked seat
    let doubleBookingRejected = false;
    try {
      await axios.post(
        `${BASE_URL}/bookings`,
        {
          showId: testShow._id,
          seats: [{ row: 'A', number: 1 }],
          paymentDetails: { method: 'Card' },
        },
        { headers: { Authorization: `Bearer ${secondUser.data.token}` } }
      );
    } catch (err) {
      doubleBookingRejected = err.response?.status === 409;
    }
    assert(doubleBookingRejected, 'Atomic check: Double booking prevented for booked seat (409)');

    // 15. Bookings: Get my bookings
    const myBookingsRes = await axios.get(`${BASE_URL}/bookings/my`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(myBookingsRes.data.data.some((b) => b._id === testBooking._id), 'GET /api/bookings/my');

    // 16. Bookings: Get single booking
    const singleBookingRes = await axios.get(`${BASE_URL}/bookings/${testBooking._id}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(singleBookingRes.data.data.bookingId === testBooking.bookingId, 'GET /api/bookings/:id');

    // 17. Bookings: Cancel booking and free seats
    const cancelRes = await axios.patch(
      `${BASE_URL}/bookings/${testBooking._id}/cancel`,
      {},
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    assert(cancelRes.data.success && cancelRes.data.data.status === 'cancelled', 'PATCH /api/bookings/:id/cancel (Status set to cancelled)');

    // Verify seats freed in show
    const seatsAfterCancel = await axios.get(`${BASE_URL}/shows/${testShow._id}/seats`);
    const seatA1 = seatsAfterCancel.data.data.seats.find((s) => s.row === 'A' && s.number === 1);
    assert(seatA1 && seatA1.status === 'available', 'Seat status restored to available after cancellation');

    // 18. Admin: Stats
    const statsRes = await axios.get(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(statsRes.data.success && statsRes.data.stats.totalMovies > 0, 'GET /api/admin/stats');

    // 19. Admin: All bookings
    const allBookingsRes = await axios.get(`${BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(allBookingsRes.data.success && allBookingsRes.data.data.length > 0, 'GET /api/bookings (Admin list all)');

    // 20. Admin: Create and delete custom show
    const newShowRes = await axios.post(
      `${BASE_URL}/shows`,
      {
        movieId: testMovie._id,
        date: '2026-12-31',
        time: '11:59 PM',
        screen: 'Screen 4 (VIP Premiere)',
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    assert(newShowRes.data.success && newShowRes.data.data._id, 'POST /api/shows (Admin create show)');

    const deleteShowRes = await axios.delete(`${BASE_URL}/shows/${newShowRes.data.data._id}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteShowRes.data.success, 'DELETE /api/shows/:id (Admin delete show)');

    // Close socket and server
    socketClient.disconnect();
    server.close();

    console.log('\n========================================');
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err.response?.data || err.message);
    if (server) server.close();
    process.exit(1);
  }
};

runTests();
