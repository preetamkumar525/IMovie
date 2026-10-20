import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Film,
  Calendar,
  Ticket,
  Plus,
  Trash2,
  Edit,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Tv,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'movies' | 'shows' | 'bookings'
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingTmdb, setSyncingTmdb] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal / Form state for Movie
  const [movieModal, setMovieModal] = useState({ open: false, isEdit: false, data: {} });
  // Modal / Form state for Show
  const [showModal, setShowModal] = useState({ open: false, data: {} });

  // Fetch admin stats & data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, moviesRes, bookingsRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/movies'),
        api.get('/bookings'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.stats);
      if (moviesRes.data.success) setMovies(moviesRes.data.data);
      if (bookingsRes.data.success) setBookings(bookingsRes.data.data);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch shows when switching to shows tab
  const fetchShows = async (movieId) => {
    try {
      if (movieId) {
        const { data } = await api.get(`/movies/${movieId}/shows`);
        if (data.success) setShows(data.data);
      } else if (movies.length > 0) {
        const { data } = await api.get(`/movies/${movies[0]._id}/shows`);
        if (data.success) setShows(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'shows' && movies.length > 0) {
      fetchShows(movies[0]._id);
    }
  }, [activeTab, movies]);

  // Trigger TMDB Sync
  const handleTmdbSync = async () => {
    try {
      setSyncingTmdb(true);
      setFeedback({ type: '', message: '' });
      const { data } = await api.post('/movies/sync');
      if (data.success) {
        setFeedback({
          type: 'success',
          message: `TMDB sync succeeded! ${data.result.moviesCount} movies synced, ${data.result.showsCreated} shows generated.`,
        });
        fetchData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Sync failed.' });
    } finally {
      setSyncingTmdb(false);
    }
  };

  // Movie Save (Create or Update)
  const handleSaveMovie = async (e) => {
    e.preventDefault();
    const movieData = movieModal.data;

    try {
      if (movieModal.isEdit) {
        const { data } = await api.put(`/movies/${movieData._id}`, movieData);
        if (data.success) {
          setFeedback({ type: 'success', message: 'Movie updated successfully' });
        }
      } else {
        const { data } = await api.post('/movies', movieData);
        if (data.success) {
          setFeedback({ type: 'success', message: 'Movie created with 7-day shows layout' });
        }
      }
      setMovieModal({ open: false, isEdit: false, data: {} });
      fetchData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to save movie' });
    }
  };

  // Delete Movie
  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Delete this movie and all its scheduled shows?')) return;
    try {
      const { data } = await api.delete(`/movies/${movieId}`);
      if (data.success) {
        setFeedback({ type: 'success', message: 'Movie removed' });
        fetchData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to delete movie' });
    }
  };

  // Create Show
  const handleCreateShow = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/shows', showModal.data);
      if (data.success) {
        setFeedback({ type: 'success', message: 'New showtime scheduled' });
        setShowModal({ open: false, data: {} });
        fetchShows(showModal.data.movieId);
        fetchData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to schedule show' });
    }
  };

  // Delete Show
  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Delete this show?')) return;
    try {
      const { data } = await api.delete(`/shows/${showId}`);
      if (data.success) {
        setFeedback({ type: 'success', message: 'Show cancelled' });
        setShows(shows.filter((s) => s._id !== showId));
        fetchData();
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to delete show' });
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="text-secondary mt-3">Loading administrator operations center...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Top Banner */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h2 className="text-white fw-bold mb-1">IMovies Admin Dashboard</h2>
          <p className="text-secondary small mb-0">System management, screenings schedules, bookings &amp; TMDB sync</p>
        </div>

        <button
          onClick={handleTmdbSync}
          disabled={syncingTmdb}
          className="btn btn-outline-warning rounded-pill px-4 py-2 d-flex align-items-center gap-2 fw-semibold"
        >
          <RefreshCw size={16} className={syncingTmdb ? 'spinner-border spinner-border-sm' : ''} />
          <span>{syncingTmdb ? 'Syncing TMDB & Shows...' : 'Sync TMDB Movies & Shows'}</span>
        </button>
      </div>

      {feedback.message && (
        <div className={`alert alert-${feedback.type} cinema-card mb-4 d-flex align-items-center justify-content-between`} role="alert">
          <div className="d-flex align-items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button type="button" className="btn-close btn-close-white" onClick={() => setFeedback({ type: '', message: '' })}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-pills mb-4 gap-2">
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn rounded-pill px-4 ${activeTab === 'overview' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
          >
            Overview &amp; Stats
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('movies')}
            className={`btn rounded-pill px-4 ${activeTab === 'movies' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
          >
            Manage Movies ({movies.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('shows')}
            className={`btn rounded-pill px-4 ${activeTab === 'shows' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
          >
            Manage Shows
          </button>
        </li>
        <li className="nav-item">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`btn rounded-pill px-4 ${activeTab === 'bookings' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
          >
            All Bookings ({bookings.length})
          </button>
        </li>
      </ul>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div>
          {/* Metrics Grid */}
          <div className="row g-4 mb-4">
            <div className="col-sm-6 col-lg-3">
              <div className="cinema-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">TOTAL REVENUE</span>
                  <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success">
                    <DollarSign size={20} />
                  </div>
                </div>
                <h3 className="text-white fw-black mb-0">${stats?.totalRevenue || 0}</h3>
                <div className="text-success small mt-1">Confirmed gross ticketing</div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="cinema-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">TOTAL BOOKINGS</span>
                  <div className="p-2 rounded-circle bg-danger bg-opacity-10 text-danger">
                    <Ticket size={20} />
                  </div>
                </div>
                <h3 className="text-white fw-black mb-0">{stats?.totalBookings || 0}</h3>
                <div className="text-secondary small mt-1">Across all screen formats</div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="cinema-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">ACTIVE MOVIES</span>
                  <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning">
                    <Film size={20} />
                  </div>
                </div>
                <h3 className="text-white fw-black mb-0">{stats?.totalMovies || 0}</h3>
                <div className="text-secondary small mt-1">Now playing in theatres</div>
              </div>
            </div>

            <div className="col-sm-6 col-lg-3">
              <div className="cinema-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">SCHEDULED SHOWS</span>
                  <div className="p-2 rounded-circle bg-info bg-opacity-10 text-info">
                    <Calendar size={20} />
                  </div>
                </div>
                <h3 className="text-white fw-black mb-0">{stats?.totalShows || 0}</h3>
                <div className="text-secondary small mt-1">Next 7 days coverage</div>
              </div>
            </div>
          </div>

          {/* Quick Bookings Table */}
          <div className="cinema-card p-4">
            <h5 className="text-white fw-bold mb-3">Recent Bookings Activity</h5>
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>BOOKING ID</th>
                    <th>CUSTOMER</th>
                    <th>MOVIE</th>
                    <th>SEATS</th>
                    <th>AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b._id}>
                      <td className="fw-mono text-danger fw-bold">{b.bookingId}</td>
                      <td>
                        <div className="text-white fw-semibold">{b.user?.name || 'Customer'}</div>
                        <div className="text-secondary small">{b.user?.email}</div>
                      </td>
                      <td className="text-white">{b.show?.movie?.title || 'Movie'}</td>
                      <td>
                        <span className="badge bg-secondary">
                          {b.seats.map((s) => `${s.row}${s.number}`).join(', ')}
                        </span>
                      </td>
                      <td className="fw-bold text-warning">${b.totalPrice}</td>
                      <td>
                        <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-danger'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE MOVIES */}
      {activeTab === 'movies' && (
        <div className="cinema-card p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h5 className="text-white fw-bold mb-0">Movie Catalog</h5>
            <button
              onClick={() => setMovieModal({ open: true, isEdit: false, data: { rating: 7.5, genres: 'Action, Sci-Fi' } })}
              className="btn btn-cinema-red rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1"
            >
              <Plus size={16} /> Add Custom Movie
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-secondary small">
                  <th>POSTER</th>
                  <th>TITLE</th>
                  <th>RATING</th>
                  <th>GENRES</th>
                  <th>TRAILER KEY</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <img
                        src={m.poster}
                        alt={m.title}
                        className="rounded object-fit-cover"
                        style={{ width: '40px', height: '56px' }}
                      />
                    </td>
                    <td className="fw-bold text-white">{m.title}</td>
                    <td className="text-warning">⭐ {m.rating}</td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {(m.genres || []).map((g, i) => (
                          <span key={i} className="badge bg-secondary" style={{ fontSize: '10px' }}>{g}</span>
                        ))}
                      </div>
                    </td>
                    <td className="text-secondary small font-monospace">{m.trailerKey || 'N/A'}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          onClick={() => setMovieModal({ open: true, isEdit: true, data: { ...m, genres: (m.genres || []).join(', ') } })}
                          className="btn btn-sm btn-outline-light rounded-circle p-1 border-secondary"
                          title="Edit Movie"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteMovie(m._id)}
                          className="btn btn-sm btn-outline-danger rounded-circle p-1"
                          title="Delete Movie"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: MANAGE SHOWS */}
      {activeTab === 'shows' && (
        <div className="cinema-card p-4">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
            <div className="d-flex align-items-center gap-3">
              <h5 className="text-white fw-bold mb-0">Auditorium Shows</h5>
              {/* Movie selector */}
              <select
                className="form-select form-select-sm bg-dark border-secondary text-white"
                style={{ width: '220px' }}
                onChange={(e) => fetchShows(e.target.value)}
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowModal({
                open: true,
                data: {
                  movieId: movies[0]?._id,
                  date: new Date().toISOString().split('T')[0],
                  time: '06:00 PM',
                  screen: 'Screen 1 (Dolby Cinema)',
                },
              })}
              className="btn btn-cinema-red rounded-pill px-3 py-1 btn-sm d-flex align-items-center gap-1"
            >
              <Plus size={16} /> Schedule Show
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-secondary small">
                  <th>DATE</th>
                  <th>TIME</th>
                  <th>SCREEN / FORMAT</th>
                  <th className="text-end">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {shows.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-secondary py-4">
                      No shows found for this selection.
                    </td>
                  </tr>
                ) : (
                  shows.map((s) => (
                    <tr key={s._id}>
                      <td className="text-white fw-semibold">{s.date}</td>
                      <td className="text-danger fw-bold">{s.time}</td>
                      <td>
                        <span className="badge bg-dark border border-secondary text-warning">
                          {s.screen}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          onClick={() => handleDeleteShow(s._id)}
                          className="btn btn-sm btn-outline-danger rounded-circle p-1"
                          title="Delete Show"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ALL BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="cinema-card p-4">
          <h5 className="text-white fw-bold mb-3">All Customer Bookings</h5>
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0 align-middle">
              <thead>
                <tr className="text-secondary small">
                  <th>ID</th>
                  <th>USER</th>
                  <th>MOVIE</th>
                  <th>SHOWTIME</th>
                  <th>SEATS</th>
                  <th>PAID</th>
                  <th>STATUS</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id}>
                    <td className="fw-mono text-danger fw-bold">{b.bookingId}</td>
                    <td>
                      <div className="text-white">{b.user?.name || 'User'}</div>
                      <div className="text-secondary small">{b.user?.email}</div>
                    </td>
                    <td className="text-white">{b.show?.movie?.title || 'Movie'}</td>
                    <td className="small text-secondary">
                      {b.show?.date} • {b.show?.time}
                    </td>
                    <td>
                      <span className="badge bg-secondary">
                        {b.seats.map((s) => `${s.row}${s.number}`).join(', ')}
                      </span>
                    </td>
                    <td className="fw-bold text-warning">${b.totalPrice}</td>
                    <td>
                      <span className={`badge ${b.status === 'confirmed' ? 'bg-success' : 'bg-danger'}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="small text-secondary">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movie Modal (Add/Edit) */}
      {movieModal.open && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content cinema-card text-white p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">{movieModal.isEdit ? 'Edit Movie' : 'Add New Movie'}</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMovieModal({ open: false, isEdit: false, data: {} })}
                ></button>
              </div>

              <form onSubmit={handleSaveMovie}>
                <div className="mb-2">
                  <label className="form-label small text-secondary">Title</label>
                  <input
                    type="text"
                    required
                    className="form-control bg-dark border-secondary text-white"
                    value={movieModal.data.title || ''}
                    onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, title: e.target.value } })}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small text-secondary">Poster URL</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={movieModal.data.poster || ''}
                    onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, poster: e.target.value } })}
                  />
                </div>

                <div className="mb-2">
                  <label className="form-label small text-secondary">Backdrop URL</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    value={movieModal.data.backdrop || ''}
                    onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, backdrop: e.target.value } })}
                  />
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-6">
                    <label className="form-label small text-secondary">Rating (0-10)</label>
                    <input
                      type="number"
                      step="0.1"
                      className="form-control bg-dark border-secondary text-white"
                      value={movieModal.data.rating || 7.5}
                      onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, rating: e.target.value } })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label small text-secondary">Trailer YouTube Key</label>
                    <input
                      type="text"
                      className="form-control bg-dark border-secondary text-white"
                      placeholder="e.g. Way9Dexny3w"
                      value={movieModal.data.trailerKey || ''}
                      onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, trailerKey: e.target.value } })}
                    />
                  </div>
                </div>

                <div className="mb-2">
                  <label className="form-label small text-secondary">Genres (comma separated)</label>
                  <input
                    type="text"
                    className="form-control bg-dark border-secondary text-white"
                    placeholder="Action, Sci-Fi, Drama"
                    value={movieModal.data.genres || ''}
                    onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, genres: e.target.value } })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary">Overview</label>
                  <textarea
                    rows="3"
                    className="form-control bg-dark border-secondary text-white"
                    value={movieModal.data.overview || ''}
                    onChange={(e) => setMovieModal({ ...movieModal, data: { ...movieModal.data, overview: e.target.value } })}
                  ></textarea>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setMovieModal({ open: false, isEdit: false, data: {} })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Save Movie
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Show Modal (Schedule Show) */}
      {showModal.open && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content cinema-card text-white p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Schedule New Screening</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal({ open: false, data: {} })}
                ></button>
              </div>

              <form onSubmit={handleCreateShow}>
                <div className="mb-3">
                  <label className="form-label small text-secondary">Movie</label>
                  <select
                    className="form-select bg-dark border-secondary text-white"
                    value={showModal.data.movieId}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, movieId: e.target.value } })}
                  >
                    {movies.map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary">Date (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    required
                    className="form-control bg-dark border-secondary text-white"
                    value={showModal.data.date}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, date: e.target.value } })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary">Time Slot</label>
                  <select
                    className="form-select bg-dark border-secondary text-white"
                    value={showModal.data.time}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, time: e.target.value } })}
                  >
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="02:15 PM">02:15 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="09:30 PM">09:30 PM</option>
                    <option value="11:45 PM">11:45 PM (Midnight)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label small text-secondary">Screen &amp; Audio Format</label>
                  <select
                    className="form-select bg-dark border-secondary text-white"
                    value={showModal.data.screen}
                    onChange={(e) => setShowModal({ ...showModal, data: { ...showModal.data, screen: e.target.value } })}
                  >
                    <option value="Screen 1 (Dolby Cinema)">Screen 1 (Dolby Cinema)</option>
                    <option value="Screen 2 (IMAX 3D Laser)">Screen 2 (IMAX 3D Laser)</option>
                    <option value="Screen 3 (4DX Motion)">Screen 3 (4DX Motion)</option>
                    <option value="Screen 4 (VIP Premiere Recliner)">Screen 4 (VIP Premiere Recliner)</option>
                  </select>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowModal({ open: false, data: {} })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger">
                    Schedule Show
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
