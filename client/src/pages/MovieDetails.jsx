import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import TrailerModal from '../components/TrailerModal';
import { Star, Clock, Calendar, Film, Play, ArrowLeft, Tv } from 'lucide-react';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingShows, setLoadingShows] = useState(false);
  const [error, setError] = useState('');
  const [trailerModal, setTrailerModal] = useState(false);

  // Fetch movie details
  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/movies/${id}`);
        if (data.success) {
          setMovie(data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load movie details');
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  // Fetch shows when movie or selectedDate changes
  useEffect(() => {
    if (!id) return;

    const fetchShowsData = async () => {
      try {
        setLoadingShows(true);
        const params = {};
        if (selectedDate) params.date = selectedDate;

        const { data } = await api.get(`/movies/${id}/shows`, { params });
        if (data.success) {
          setShows(data.data);
          if (data.dates && data.dates.length > 0) {
            setAvailableDates(data.dates);
            if (!selectedDate) {
              setSelectedDate(data.dates[0]);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching shows:', err);
      } finally {
        setLoadingShows(false);
      }
    };

    fetchShowsData();
  }, [id, selectedDate]);

  // Format date helper: "2026-10-21" -> { dayName: "Wed", dayNum: "21", month: "Oct" }
  const formatDatePill = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return {
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNum: d.getDate(),
      month: d.toLocaleDateString('en-US', { month: 'short' }),
    };
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading movie...</span>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger cinema-card d-inline-block px-5 py-4">
          <h4 className="alert-heading text-white mb-2">Movie Not Found</h4>
          <p className="text-secondary">{error || 'The requested movie could not be located.'}</p>
          <button onClick={() => navigate('/')} className="btn btn-outline-light rounded-pill px-4 mt-2">
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Backdrop Banner with Overview */}
      <div
        className="position-relative overflow-hidden"
        style={{
          minHeight: '420px',
          backgroundImage: `url(${movie.backdrop || movie.poster})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 20%',
        }}
      >
        <div className="position-absolute top-0 start-0 w-100 h-100 hero-backdrop-overlay" />

        <div className="container position-relative py-5">
          <button
            onClick={() => navigate('/')}
            className="btn btn-sm btn-outline-light rounded-pill mb-4 d-inline-flex align-items-center gap-1 border-secondary"
            style={{ background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(4px)' }}
          >
            <ArrowLeft size={16} /> Back to Movies
          </button>

          <div className="row align-items-center g-4">
            {/* Poster Card */}
            <div className="col-md-4 col-lg-3 text-center text-md-start">
              <div className="movie-poster-wrap shadow-2xl mx-auto mx-md-0" style={{ maxWidth: '260px' }}>
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-100 h-100 object-fit-cover rounded-3"
                />
              </div>
            </div>

            {/* Movie Info */}
            <div className="col-md-8 col-lg-9">
              <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                <span className="badge bg-danger rounded-pill px-3 py-1 fw-bold">NOW SHOWING</span>
                <span className="text-warning fw-bold d-flex align-items-center gap-1">
                  <Star size={16} className="fill-warning" /> {movie.rating ? movie.rating.toFixed(1) : '7.5'} / 10
                </span>
                <span className="text-secondary">•</span>
                <span className="text-secondary small">{movie.releaseDate}</span>
              </div>

              <h1 className="display-5 fw-black text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
                {movie.title}
              </h1>

              {/* Genre Pills */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {(movie.genres || []).map((g, idx) => (
                  <span key={idx} className="badge bg-dark border border-secondary text-light px-3 py-1 rounded-pill">
                    {g}
                  </span>
                ))}
              </div>

              <p className="lead fs-6 text-light text-opacity-80 mb-4" style={{ maxWidth: '750px', lineHeight: '1.6' }}>
                {movie.overview}
              </p>

              {/* Action Buttons */}
              <div className="d-flex flex-wrap gap-3">
                {movie.trailerKey && (
                  <button
                    onClick={() => setTrailerModal(true)}
                    className="btn btn-outline-light rounded-pill px-4 py-2 d-flex align-items-center gap-2"
                    style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)' }}
                  >
                    <Play size={18} className="fill-white" /> Watch Official Trailer
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Showtimes & Date Selection Section */}
      <div className="container py-5">
        <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
          <div>
            <h3 className="text-white fw-bold d-flex align-items-center gap-2 mb-1">
              <Calendar className="text-danger" size={24} /> Select Date &amp; Showtime
            </h3>
            <p className="text-secondary small mb-0">Choose your preferred screening date and auditorium</p>
          </div>
        </div>

        {/* Date Selector Tabs */}
        {availableDates.length > 0 ? (
          <div className="d-flex gap-3 overflow-x-auto pb-3 mb-4">
            {availableDates.map((dateStr) => {
              const { dayName, dayNum, month } = formatDatePill(dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`btn p-3 rounded-4 text-center transition-all d-flex flex-column align-items-center justify-content-center ${
                    isSelected
                      ? 'btn-danger shadow-lg'
                      : 'cinema-card text-light border-secondary border-opacity-50'
                  }`}
                  style={{ minWidth: '90px' }}
                >
                  <span className="small text-uppercase opacity-75 fw-bold">{dayName}</span>
                  <span className="fs-3 fw-black my-1">{dayNum}</span>
                  <span className="small opacity-75">{month}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-secondary mb-4">No scheduled dates available.</div>
        )}

        {/* Shows list */}
        {loadingShows ? (
          <div className="text-center py-4">
            <div className="spinner-border text-danger spinner-border-sm" role="status"></div>
            <span className="ms-2 text-secondary">Loading showtimes...</span>
          </div>
        ) : shows.length === 0 ? (
          <div className="cinema-card p-5 text-center">
            <Tv size={36} className="text-secondary mb-2 opacity-50" />
            <h5 className="text-white">No showtimes available for this date</h5>
            <p className="text-secondary small mb-0">Please select another date above or check back later.</p>
          </div>
        ) : (
          <div className="row g-4">
            {shows.map((show) => (
              <div key={show._id} className="col-md-6 col-lg-4">
                <div className="cinema-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <span className="badge bg-dark border border-secondary text-warning fw-semibold px-2 py-1">
                        {show.screen}
                      </span>
                      <span className="text-secondary small d-flex align-items-center gap-1">
                        <Clock size={14} /> 2h 45m
                      </span>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-3">
                      <div className="p-3 rounded-3 text-center" style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.3)' }}>
                        <span className="fs-4 fw-bold text-danger">{show.time}</span>
                      </div>
                      <div>
                        <div className="text-white fw-semibold">Standard &amp; VIP Seating</div>
                        <div className="text-secondary small">Dolby Atmos Surround Audio</div>
                      </div>
                    </div>

                    <div className="small text-secondary mb-3">
                      <span>Pricing: Silver ($150) • Gold ($220) • Premium ($320)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/shows/${show._id}/seats`)}
                    className="btn btn-cinema-red rounded-pill w-100 py-2 d-flex align-items-center justify-content-center gap-2 mt-2"
                  >
                    Select Seats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      <TrailerModal
        show={trailerModal}
        trailerKey={movie.trailerKey}
        title={movie.title}
        onClose={() => setTrailerModal(false)}
      />
    </div>
  );
};

export default MovieDetails;
