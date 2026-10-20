const Movie = require('../models/Movie');
const Show = require('../models/Show');
const { generateShowsForMovie, syncMoviesAndShows } = require('../services/tmdbService');

// @desc    Get all movies with search and genre filtering
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res, next) => {
  try {
    const { search, genre } = req.query;
    let query = {};

    if (search && search.trim() !== '') {
      query.title = { $regex: search.trim(), $options: 'i' };
    }

    if (genre && genre !== 'All' && genre.trim() !== '') {
      query.genres = { $in: [new RegExp(genre.trim(), 'i')] };
    }

    const movies = await Movie.find(query).sort({ rating: -1, createdAt: -1 });

    // Also get all distinct genres for easy client filtering
    const allGenres = await Movie.distinct('genres');

    res.status(200).json({
      success: true,
      count: movies.length,
      genres: allGenres.filter(Boolean).sort(),
      data: movies,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.status(200).json({
      success: true,
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all shows for a specific movie (optionally filtered by date)
// @route   GET /api/movies/:id/shows
// @access  Public
const getMovieShows = async (req, res, next) => {
  try {
    const { date } = req.query;
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    let filter = { movie: movie._id };
    if (date) {
      filter.date = date;
    }

    const shows = await Show.find(filter)
      .select('movie date time screen createdAt')
      .sort({ date: 1, time: 1 });

    // Distinct dates available for this movie
    const distinctDates = await Show.find({ movie: movie._id }).distinct('date');
    distinctDates.sort();

    res.status(200).json({
      success: true,
      dates: distinctDates,
      count: shows.length,
      data: shows,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new movie (Admin)
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res, next) => {
  try {
    const { title, poster, backdrop, overview, rating, releaseDate, genres, trailerKey } = req.body;

    const movie = await Movie.create({
      title,
      poster,
      backdrop,
      overview,
      rating: rating ? Number(rating) : 7.0,
      releaseDate,
      genres: Array.isArray(genres) ? genres : (genres ? genres.split(',').map(g => g.trim()) : []),
      trailerKey: trailerKey || '',
    });

    // Auto-generate shows for this movie for the next 7 days
    await generateShowsForMovie(movie);

    res.status(201).json({
      success: true,
      message: 'Movie created and shows scheduled successfully',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie (Admin)
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res, next) => {
  try {
    const { title, poster, backdrop, overview, rating, releaseDate, genres, trailerKey } = req.body;

    let movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    movie.title = title || movie.title;
    movie.poster = poster !== undefined ? poster : movie.poster;
    movie.backdrop = backdrop !== undefined ? backdrop : movie.backdrop;
    movie.overview = overview !== undefined ? overview : movie.overview;
    movie.rating = rating !== undefined ? Number(rating) : movie.rating;
    movie.releaseDate = releaseDate || movie.releaseDate;
    if (genres) {
      movie.genres = Array.isArray(genres) ? genres : genres.split(',').map(g => g.trim());
    }
    if (trailerKey !== undefined) {
      movie.trailerKey = trailerKey;
    }

    await movie.save();

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      data: movie,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie and its shows (Admin)
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Delete associated shows
    await Show.deleteMany({ movie: movie._id });
    await Movie.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Movie and associated shows deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger TMDB sync manually (Admin)
// @route   POST /api/movies/sync
// @access  Private/Admin
const triggerTmdbSync = async (req, res, next) => {
  try {
    const result = await syncMoviesAndShows();
    res.status(200).json({
      success: true,
      message: 'TMDB sync completed successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMovies,
  getMovieById,
  getMovieShows,
  createMovie,
  updateMovie,
  deleteMovie,
  triggerTmdbSync,
};
