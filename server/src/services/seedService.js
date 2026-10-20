const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { syncMoviesAndShows } = require('./tmdbService');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedInitialData = async () => {
  try {
    console.log('🌱 Checking seed data...');

    // 1. Ensure Admin User
    const adminEmail = 'admin@imovies.com';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'IMovies Admin',
        email: adminEmail,
        password: 'admin123',
        role: 'admin',
      });
      console.log('✅ Admin user created: admin@imovies.com / admin123');
    }

    // 2. Ensure Demo User
    const userEmail = 'user@imovies.com';
    let demoUser = await User.findOne({ email: userEmail });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Alex Johnson',
        email: userEmail,
        password: 'user123',
        role: 'user',
      });
      console.log('✅ Demo user created: user@imovies.com / user123');
    }

    // 3. Ensure Movies & Shows
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('No movies found in database. Running initial movie & show generation...');
      await syncMoviesAndShows();
    } else {
      console.log(`Database already has ${movieCount} movies.`);
    }

    console.log('✨ Seed check completed.');
  } catch (error) {
    console.error('Error seeding data:', error.message);
  }
};

// If run directly from CLI
if (require.main === module) {
  const connectDB = require('../config/db');
  (async () => {
    await connectDB();
    await seedInitialData();
    process.exit(0);
  })();
}

module.exports = { seedInitialData };
