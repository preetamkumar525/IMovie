import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import MovieCard from '../components/MovieCard';
import TrailerModal from '../components/TrailerModal';
import { Search, Film, Sparkles, AlertCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trailerModal, setTrailerModal] = useState({ show: false, key: '', title: '' });

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedGenre !== 'All') params.genre = selectedGenre;
      if (searchTerm.trim() !== '') params.search = searchTerm.trim();

      const { data } = await api.get('/movies', { params });
      if (data.success) {
        setMovies(data.data);
        if (data.genres && data.genres.length > 0) {
          setGenres(['All', ...data.genres]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [selectedGenre]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies();
  };

  const featuredMovie = movies.length > 0 ? movies[0] : null;

  return (
    <div>
      {/* Featured Blockbuster Hero Banner */}
      {featuredMovie && !searchTerm && selectedGenre === 'All' && (
        <section className="position-relative overflow-hidden mb-5" style={{ minHeight: '480px' }}>
          {/* Background backdrop with cinematic overlay */}
          <div
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{
              backgroundImage: `url(${featuredMovie.backdrop || featuredMovie.poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 20%',
              filter: 'brightness(0.4) saturate(1.2)',
            }}
          />
          <div className="position-absolute top-0 start-0 w-100 h-100 hero-backdrop-overlay" />

          <div className="container position-relative py-5" style={{ zIndex: 2 }}>
            <div className="row align-items-center pt-4 pt-md-5">
              <div className="col-lg-8 col-xl-7">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="badge bg-danger rounded-pill px-3 py-1 fw-bold text-uppercase d-inline-flex align-items-center gap-1">
                    <Sparkles size={14} /> Spotlight Premiere
                  </span>
                  <span className="text-warning fw-bold small">⭐ {featuredMovie.rating} Rating</span>
                </div>

                <h1 className="display-4 fw-black text-white text-shadow mb-3" style={{ letterSpacing: '-0.03em' }}>
                  {featuredMovie.title}
                </h1>

                <p className="lead text-light text-opacity-75 mb-4 line-clamp-3" style={{ maxWidth: '600px' }}>
                  {featuredMovie.overview}
                </p>

                <div className="d-flex flex-wrap gap-3">
                  <Link
                    to={`/movie/${featuredMovie._id}`}
                    className="btn btn-cinema-red btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2 shadow-lg"
                  >
                    <Film size={20} /> Book Tickets Now
                  </Link>

                  {featuredMovie.trailerKey && (
                    <button
                      onClick={() => setTrailerModal({ show: true, key: featuredMovie.trailerKey, title: featuredMovie.title })}
                      className="btn btn-outline-light btn-lg rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                      style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}
                    >
                      <Play size={20} className="fill-white" /> Watch Trailer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Catalog Section */}
      <div className="container my-4">
        {/* Header & Search Bar */}
        <div className="row align-items-center justify-content-between g-3 mb-4">
          <div className="col-md-5">
            <h2 className="text-white fw-bold d-flex align-items-center gap-2 mb-1">
              <Film className="text-danger" size={26} /> Now Showing
            </h2>
            <p className="text-secondary small mb-0">Browse latest releases and reserve your seats in real-time</p>
          </div>

          <div className="col-md-6 col-lg-5">
            <form onSubmit={handleSearchSubmit} className="position-relative">
              <input
                type="text"
                className="form-control bg-dark border-secondary text-white rounded-pill ps-4 pe-5 py-2"
                placeholder="Search movies by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className="btn position-absolute top-50 end-0 translate-middle-y me-2 text-danger border-0 p-1"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Genre Filter Pills */}
        {genres.length > 0 && (
          <div className="d-flex flex-wrap gap-2 mb-4 pb-2 overflow-x-auto">
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`btn btn-sm rounded-pill px-3 py-1 transition-all ${
                  selectedGenre === genre
                    ? 'btn-danger fw-semibold shadow-sm'
                    : 'btn-outline-secondary text-light border-secondary border-opacity-50'
                }`}
                style={{ fontSize: '13px' }}
              >
                {genre}
              </button>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="alert alert-danger cinema-card d-flex align-items-center gap-2" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading movies...</span>
            </div>
            <p className="text-secondary mt-3">Fetching now-playing cinema releases...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="cinema-card text-center py-5 my-4">
            <Film size={48} className="text-secondary mb-3 opacity-50" />
            <h4 className="text-white">No movies found</h4>
            <p className="text-secondary mb-3">Try adjusting your search terms or genre filter.</p>
            <button
              onClick={() => { setSelectedGenre('All'); setSearchTerm(''); }}
              className="btn btn-outline-danger rounded-pill px-4"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          /* Movie Cards Grid */
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {movies.map((movie) => (
              <MovieCard
                key={movie._id}
                movie={movie}
                onWatchTrailer={(m) => setTrailerModal({ show: true, key: m.trailerKey, title: m.title })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        show={trailerModal.show}
        trailerKey={trailerModal.key}
        title={trailerModal.title}
        onClose={() => setTrailerModal({ show: false, key: '', title: '' })}
      />
    </div>
  );
};

export default Home;
