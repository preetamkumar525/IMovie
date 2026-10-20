import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Play, Calendar } from 'lucide-react';

const MovieCard = ({ movie, onWatchTrailer }) => {
  const defaultPoster = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop&q=80';
  const posterUrl = movie.poster || defaultPoster;
  const releaseYear = movie.releaseDate ? movie.releaseDate.split('-')[0] : '';

  return (
    <div className="col">
      <div className="cinema-card h-100 d-flex flex-column overflow-hidden position-relative">
        {/* Poster Wrapper with Hover Overlay */}
        <div className="movie-poster-wrap position-relative" style={{ aspectRatio: '2/3', background: '#1a202c' }}>
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-100 h-100 object-fit-cover"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultPoster;
            }}
          />

          {/* Rating Badge */}
          <div
            className="position-absolute top-0 start-0 m-2 px-2 py-1 rounded-pill d-flex align-items-center gap-1 shadow-sm"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(6px)', border: '1px solid rgba(245, 158, 11, 0.3)' }}
          >
            <Star size={13} className="text-warning fill-warning" />
            <span className="fw-bold small text-white">{movie.rating ? movie.rating.toFixed(1) : '7.5'}</span>
          </div>

          {/* Quick Play Trailer Button on Hover */}
          {movie.trailerKey && (
            <button
              onClick={() => onWatchTrailer && onWatchTrailer(movie)}
              className="position-absolute top-50 start-50 translate-middle btn btn-danger rounded-circle p-3 d-flex align-items-center justify-content-center shadow-lg border-0 opacity-0 hover-opacity"
              title="Watch Trailer"
              style={{ transition: 'opacity 0.2s ease, transform 0.2s ease' }}
            >
              <Play size={22} className="fill-white ms-1" />
            </button>
          )}
        </div>

        {/* Details Content */}
        <div className="p-3 d-flex flex-column flex-grow-1">
          <div className="d-flex align-items-center justify-content-between text-secondary small mb-1">
            <span className="d-flex align-items-center gap-1">
              <Calendar size={13} /> {releaseYear || '2024'}
            </span>
            <span className="badge bg-dark border border-secondary text-light px-2 py-1">2D / 3D / IMAX</span>
          </div>

          <h5 className="card-title text-white fw-bold mb-2 text-truncate" title={movie.title}>
            {movie.title}
          </h5>

          {/* Genres */}
          <div className="d-flex flex-wrap gap-1 mb-3">
            {(movie.genres || []).slice(0, 3).map((genre, idx) => (
              <span
                key={idx}
                className="badge rounded-pill fw-normal text-secondary-emphasis"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', fontSize: '11px' }}
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-2 d-grid gap-2">
            <Link
              to={`/movie/${movie._id}`}
              className="btn btn-cinema-red rounded-pill py-2 text-decoration-none text-center d-flex align-items-center justify-content-center gap-2"
            >
              Book Tickets
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
