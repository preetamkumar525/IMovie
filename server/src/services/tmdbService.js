const axios = require('axios');
const Movie = require('../models/Movie');
const Show = require('../models/Show');

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// Curated high-quality fallback movie data in case TMDB_API_KEY is not configured or offline
const FALLBACK_MOVIES = [
  {
    tmdbId: 693134,
    title: 'Dune: Part Two',
    poster: 'https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s520DRq.jpg',
    overview: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future only he can foresee.',
    rating: 8.2,
    releaseDate: '2024-03-01',
    genres: ['Science Fiction', 'Adventure', 'Action'],
    trailerKey: 'Way9Dexny3w',
  },
  {
    tmdbId: 872585,
    title: 'Oppenheimer',
    poster: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg',
    overview: 'The story of J. Robert Oppenheimer’s role in the development of the atomic bomb during World War II, exploring the moral paradoxes and scientific triumph that shaped the modern world.',
    rating: 8.1,
    releaseDate: '2023-07-21',
    genres: ['Drama', 'History', 'Biography'],
    trailerKey: 'uYPbbksJxIg',
  },
  {
    tmdbId: 569094,
    title: 'Spider-Man: Across the Spider-Verse',
    poster: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg',
    overview: 'After reuniting with Gwen Stacy, Brooklyn’s full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse, where he encounters the Spider Society, a team of Spider-People charged with protecting the Multiverse’s very existence.',
    rating: 8.4,
    releaseDate: '2023-06-02',
    genres: ['Animation', 'Action', 'Adventure', 'Sci-Fi'],
    trailerKey: 'cqGjhVJWtEg',
  },
  {
    tmdbId: 533535,
    title: 'Deadpool & Wolverine',
    poster: 'https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/yDHYTjA3R0jFYba16jBB1jv82E9.jpg',
    overview: 'A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him. But when his homeworld faces an existential threat, Wade must reluctantly suit-up again with an even more reluctant Wolverine.',
    rating: 7.7,
    releaseDate: '2024-07-26',
    genres: ['Action', 'Comedy', 'Sci-Fi'],
    trailerKey: '73_1biulkYk',
  },
  {
    tmdbId: 558449,
    title: 'Gladiator II',
    poster: 'https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/euYIwmwkmz95mnXvufEmbL69ovr.jpg',
    overview: 'Years after witnessing the death of the revered hero Maximus at the hands of his uncle, Lucius must enter the Colosseum after his home is conquered by the tyrannical Emperors who now lead Rome with an iron fist.',
    rating: 7.5,
    releaseDate: '2024-11-22',
    genres: ['Action', 'Adventure', 'Drama'],
    trailerKey: '4rgYUipGJNo',
  },
  {
    tmdbId: 157336,
    title: 'Interstellar',
    poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/rAiYTsqJJinErvoNmzq0cuApFDZ.jpg',
    overview: 'The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.',
    rating: 8.4,
    releaseDate: '2014-11-07',
    genres: ['Adventure', 'Drama', 'Science Fiction'],
    trailerKey: 'zSWdZVtXT7E',
  },
  {
    tmdbId: 27205,
    title: 'Inception',
    poster: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg',
    overview: 'Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: "inception", the implantation of another person\'s idea into a target\'s subconscious.',
    rating: 8.3,
    releaseDate: '2010-07-16',
    genres: ['Action', 'Sci-Fi', 'Adventure'],
    trailerKey: 'YoHD9XEInc0',
  },
  {
    tmdbId: 155,
    title: 'The Dark Knight',
    poster: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    overview: 'Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.',
    rating: 8.5,
    releaseDate: '2008-07-18',
    genres: ['Drama', 'Action', 'Crime', 'Thriller'],
    trailerKey: 'EXeTwQWrcwY',
  }
];

// Helper to generate 120-seat layout (Rows A-J, 12 seats per row)
const generateSeatLayout = () => {
  const seats = [];
  const rows = [
    { row: 'A', type: 'Silver', price: 150 },
    { row: 'B', type: 'Silver', price: 150 },
    { row: 'C', type: 'Silver', price: 150 },
    { row: 'D', type: 'Gold', price: 220 },
    { row: 'E', type: 'Gold', price: 220 },
    { row: 'F', type: 'Gold', price: 220 },
    { row: 'G', type: 'Gold', price: 220 },
    { row: 'H', type: 'Premium', price: 320 },
    { row: 'I', type: 'Premium', price: 320 },
    { row: 'J', type: 'Premium', price: 320 },
  ];

  rows.forEach((r) => {
    for (let num = 1; num <= 12; num++) {
      seats.push({
        row: r.row,
        number: num,
        type: r.type,
        price: r.price,
        status: 'available',
        heldBy: null,
        heldUntil: null,
      });
    }
  });

  return seats;
};

// Generate shows for a movie for the next 7 days
const generateShowsForMovie = async (movieDoc) => {
  const timeSlots = ['10:30 AM', '02:15 PM', '06:00 PM', '09:30 PM'];
  const screens = ['Screen 1 (Dolby Atmos)', 'Screen 2 (IMAX 3D)', 'Screen 3 (4DX)', 'Screen 4 (VIP Premiere)'];

  const now = new Date();
  let createdCount = 0;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayOffset);
    const dateStr = targetDate.toISOString().split('T')[0];

    for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
      const time = timeSlots[slotIndex];
      const screen = screens[slotIndex % screens.length];

      // Check if show already exists for this movie, date, and time
      const existingShow = await Show.findOne({
        movie: movieDoc._id,
        date: dateStr,
        time: time,
      });

      if (!existingShow) {
        await Show.create({
          movie: movieDoc._id,
          date: dateStr,
          time: time,
          screen: screen,
          seats: generateSeatLayout(),
        });
        createdCount++;
      }
    }
  }

  return createdCount;
};

// Main sync function
const syncMoviesAndShows = async () => {
  console.log('🔄 Starting TMDB sync / catalog check...');
  const apiKey = process.env.TMDB_API_KEY;
  let moviesToProcess = [];

  if (apiKey && apiKey.trim() !== '') {
    try {
      console.log('Fetching now playing movies from TMDB API...');
      const response = await axios.get(`${TMDB_BASE_URL}/movie/now_playing`, {
        params: {
          api_key: apiKey,
          language: 'en-US',
          page: 1,
        },
        timeout: 7000,
      });

      const tmdbList = response.data.results || [];
      console.log(`Retrieved ${tmdbList.length} movies from TMDB.`);

      // Genre lookup map
      const genreMap = {
        28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
        80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
        14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
        9648: 'Mystery', 10749: 'Romance', 878: 'Science Fiction',
        10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western',
      };

      for (const item of tmdbList.slice(0, 10)) {
        let trailerKey = '';
        try {
          const videoRes = await axios.get(`${TMDB_BASE_URL}/movie/${item.id}/videos`, {
            params: { api_key: apiKey },
            timeout: 5000,
          });
          const videos = videoRes.data.results || [];
          const trailer = videos.find((v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser'));
          if (trailer) trailerKey = trailer.key;
        } catch (vErr) {
          console.warn(`Could not fetch trailer for TMDB id ${item.id}:`, vErr.message);
        }

        const genres = (item.genre_ids || []).map((id) => genreMap[id] || 'Cinema');

        moviesToProcess.push({
          tmdbId: item.id,
          title: item.title,
          poster: item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : '',
          backdrop: item.backdrop_path ? `${TMDB_IMAGE_BASE}/original${item.backdrop_path}` : '',
          overview: item.overview || '',
          rating: item.vote_average ? Math.round(item.vote_average * 10) / 10 : 7.5,
          releaseDate: item.release_date || new Date().toISOString().split('T')[0],
          genres: genres.length > 0 ? genres : ['Action', 'Drama'],
          trailerKey: trailerKey || 'Way9Dexny3w',
        });
      }
    } catch (apiError) {
      console.warn('⚠️ TMDB API request failed or invalid key:', apiError.message);
      console.log('Using high-quality fallback movie catalog.');
      moviesToProcess = FALLBACK_MOVIES;
    }
  } else {
    console.log('ℹ️ TMDB_API_KEY not configured. Using high-quality curated movie catalog.');
    moviesToProcess = FALLBACK_MOVIES;
  }

  // Upsert movies into MongoDB and generate shows
  let totalShowsCreated = 0;
  for (const m of moviesToProcess) {
    let movieDoc = await Movie.findOne({
      $or: [{ tmdbId: m.tmdbId }, { title: m.title }],
    });

    if (!movieDoc) {
      movieDoc = await Movie.create(m);
      console.log(`Created movie: "${movieDoc.title}"`);
    } else {
      // update details
      movieDoc.poster = m.poster || movieDoc.poster;
      movieDoc.backdrop = m.backdrop || movieDoc.backdrop;
      movieDoc.overview = m.overview || movieDoc.overview;
      movieDoc.rating = m.rating || movieDoc.rating;
      movieDoc.genres = m.genres && m.genres.length > 0 ? m.genres : movieDoc.genres;
      if (m.trailerKey) movieDoc.trailerKey = m.trailerKey;
      await movieDoc.save();
    }

    const showsAdded = await generateShowsForMovie(movieDoc);
    totalShowsCreated += showsAdded;
  }

  console.log(`✅ TMDB sync finished. Created ${totalShowsCreated} new shows.`);
  return { success: true, moviesCount: moviesToProcess.length, showsCreated: totalShowsCreated };
};

module.exports = { syncMoviesAndShows, generateShowsForMovie, generateSeatLayout };
