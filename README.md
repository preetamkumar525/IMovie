# IMovies - Full-Stack Movie Ticket Booking Web App 🎬🍿

A modern, full-stack cinema ticket booking web application built with the **MERN** stack (MongoDB, Express, React, Node.js) and **Socket.io** for real-time seat synchronization.

![IMovies Banner](https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

### 🎬 Real-time Cinema Seating & Socket.io
- **Live Seat Availability**: Auditorium seating map syncs in real-time across all connected clients via Socket.io rooms (`show_<id>`).
- **5-Minute Seat Hold Mechanism**: Selected seats are reserved for 5 minutes with atomic double-booking prevention.
- **Auto-Release Engine**: A background worker automatically expires holds and restores seat availability, instantly broadcasting updates to active viewers.
- **Tiered Seating Layout**: 120-seat interactive auditorium with **Silver** ($150), **Gold** ($220), and **Premium** ($320) tiers across rows A–J.

### 🎥 Dynamic TMDB Sync & 7-Day Show Generator
- **TMDB Integration**: Synchronizes now-playing releases, high-res posters, backdrops, ratings, and YouTube trailers on startup and daily at midnight via `node-cron`.
- **Offline / Zero-Key Fallback**: Includes a curated catalog of blockbusters (Dune 2, Oppenheimer, Spider-Verse, Interstellar, etc.) ensuring the app runs out-of-the-box even without a TMDB API key.
- **Automated Scheduling**: Automatically populates 3–4 time slots per day for the next 7 days for every synchronized movie across Dolby Cinema, IMAX 3D, 4DX, and VIP screens.

### 🎟️ Complete User Experience & Ticket Pass
- **Hero Spotlight & Catalog**: Search movies by title and filter by genre pills.
- **Movie Details & Trailer Player**: Full overview, ratings, embedded YouTube trailer modal, and interactive 7-day date selector.
- **Interactive Mock Checkout**: Credit/debit card form with live card preview, 5-minute countdown clock, and simulated payment gateway.
- **Digital Cinema Pass**: Scannable QR code generated via `qrcode.react`, printable ticket layout, booking reference, and auditorium details.
- **My Bookings & Cancellation**: View historical and active tickets with one-click cancellation that immediately frees up seats in real time.

### 🛡️ Admin Management Operations Center
- **Protected Dashboard**: Metric cards for Total Revenue, Total Bookings, Active Movies, and Scheduled Shows.
- **Movie Management**: Add custom movies, update movie details, or delete movies.
- **Auditorium Management**: Schedule new screenings and delete shows.
- **Manual TMDB Trigger**: One-click button to synchronize latest TMDB releases on-demand.
- **All Bookings Inspector**: Comprehensive log of all customer transactions.

---

## 🏗️ Architecture & Tech Stack

```
imovie/
├── server/                     # Backend API & Socket.io server
│   ├── src/
│   │   ├── config/             # DB connection (MongoDB Atlas + In-Memory fallback)
│   │   ├── controllers/        # Auth, Movie, Show, Booking controllers
│   │   ├── middleware/         # JWT auth, role authorization, centralized error handler
│   │   ├── models/             # Mongoose schemas: User, Movie, Show, Booking
│   │   ├── routes/             # REST endpoints (/api/auth, /movies, /shows, /bookings, /admin)
│   │   ├── services/           # TMDB sync, seat cleanup worker, DB seeder
│   │   ├── sockets/            # Socket.io room management & seat event broadcaster
│   │   └── index.js            # Express server entrypoint
│   ├── .env.example
│   └── package.json
│
└── client/                     # Frontend Single Page App
    ├── src/
    │   ├── api/                # Axios instance with JWT auth interceptors
    │   ├── components/         # Navbar, Footer, MovieCard, TrailerModal, ProtectedRoute
    │   ├── context/            # AuthContext, SocketContext
    │   ├── pages/              # Home, MovieDetails, SeatSelection, Payment, Ticket, MyBookings, Admin
    │   ├── styles/             # Cinema dark theme CSS with curved screen & neon seats
    │   ├── App.jsx             # React Router routing
    │   └── main.jsx
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

- **Backend**: Node.js, Express 4, MongoDB Atlas / Mongoose 8, Socket.io 4, bcryptjs, jsonwebtoken, helmet, cors, node-cron.
- **Frontend**: React 18, Vite 5, Bootstrap 5.3, Bootstrap Icons, Lucide Icons, QR Code SVG, Canvas Confetti.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or newer recommended)
- npm or yarn

### 2. Backend Setup
1. Open a terminal in `/server`:
   ```bash
   cd server
   npm install
   ```

2. Configure environment variables in `server/.env` (or copy from `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://user:password@cluster0.mongodb.net/imovies?retryWrites=true&w=majority
   JWT_SECRET=imovies_super_secret_jwt_key_2026_cinema_secure!
   TMDB_API_KEY=your_tmdb_api_key_here
   CLIENT_URL=http://localhost:5173
   ```
   > **Note:** If `MONGO_URI` is not provided or local MongoDB is offline, an in-memory MongoDB instance automatically boots up so you can test immediately without any database setup!

3. Start the backend server:
   ```bash
   npm start
   # or with auto-reload:
   npm run dev
   ```
   The server starts at `http://localhost:5000`.

### 3. Frontend Setup
1. Open a second terminal in `/client`:
   ```bash
   cd client
   npm install
   ```

2. Configure environment variables in `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. Start Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔑 Default Credentials (Pre-seeded)

When the server runs for the first time, it automatically creates sample users:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@imovies.com` | `admin123` |
| **Demo User** | `user@imovies.com` | `user123` |

*(The login screen also features 1-click **Quick Demo Login** buttons to fill these credentials instantly.)*

---

## 📡 API Reference

### Authentication
- `POST /api/auth/signup` - Register a new account
- `POST /api/auth/login` - Authenticate and retrieve JWT token
- `GET /api/auth/me` - Get profile of authenticated user

### Movies
- `GET /api/movies` - List movies with search (`?search=`) and genre filter (`?genre=`)
- `GET /api/movies/:id` - Movie details
- `GET /api/movies/:id/shows` - Get shows for movie (`?date=YYYY-MM-DD`)
- `POST /api/movies` - (Admin) Create movie + generate 7-day shows
- `PUT /api/movies/:id` - (Admin) Update movie
- `DELETE /api/movies/:id` - (Admin) Delete movie
- `POST /api/movies/sync` - (Admin) Trigger manual TMDB sync

### Shows & Seating
- `GET /api/shows/:id/seats` - Get auditorium seat map (auto-cleans expired holds)
- `POST /api/shows/:id/hold` - Hold selected seats for 5 minutes (emits real-time socket event)
- `POST /api/shows/:id/release` - Release seats held by current user
- `POST /api/shows` - (Admin) Schedule a new show
- `DELETE /api/shows/:id` - (Admin) Delete a show

### Bookings
- `POST /api/bookings` - Confirm held seats after payment verification (prevents double-booking)
- `GET /api/bookings/my` - Current user's booking history
- `GET /api/bookings/:id` - Single booking details
- `PATCH /api/bookings/:id/cancel` - Cancel booking and immediately free seats
- `GET /api/bookings` - (Admin) View all bookings across platform
- `GET /api/admin/stats` - (Admin) View revenue, booking counts, and stats

---

## 🧪 Testing & Building

### Running Frontend Production Build
```bash
cd client
npm run build
```

---

## 📄 License
MIT License. Built for movie enthusiasts.
