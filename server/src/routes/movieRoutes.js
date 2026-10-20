const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  getMovieShows,
  createMovie,
  updateMovie,
  deleteMovie,
  triggerTmdbSync,
} = require('../controllers/movieController');
const { protect, authorize } = require('../middleware/auth');

router.route('/')
  .get(getMovies)
  .post(protect, authorize('admin'), createMovie);

router.post('/sync', protect, authorize('admin'), triggerTmdbSync);

router.route('/:id')
  .get(getMovieById)
  .put(protect, authorize('admin'), updateMovie)
  .delete(protect, authorize('admin'), deleteMovie);

router.get('/:id/shows', getMovieShows);

module.exports = router;
