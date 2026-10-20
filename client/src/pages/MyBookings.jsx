import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Ticket, Calendar, Clock, AlertCircle, XCircle, Eye, Film } from 'lucide-react';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/bookings/my');
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this booking? The seats will be immediately made available for other guests.'
    );

    if (!confirmCancel) return;

    try {
      setCancellingId(bookingId);
      setFeedbackMessage('');

      const { data } = await api.patch(`/bookings/${bookingId}/cancel`);
      if (data.success) {
        setFeedbackMessage('Booking was cancelled successfully. Seats have been freed.');
        // Update local list
        setBookings((prev) =>
          prev.map((b) => (b._id === bookingId ? { ...b, status: 'cancelled' } : b))
        );
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="text-secondary mt-3">Loading your tickets history...</p>
      </div>
    );
  }

  return (
    <div className="container py-5">
      <div className="d-flex align-items-center justify-content-between mb-4 border-bottom border-secondary border-opacity-25 pb-3">
        <div>
          <h2 className="text-white fw-bold d-flex align-items-center gap-2 mb-1">
            <Ticket className="text-danger" size={28} /> My Bookings
          </h2>
          <p className="text-secondary small mb-0">Manage your cinema reservations and digital passes</p>
        </div>

        <Link to="/" className="btn btn-outline-danger rounded-pill btn-sm px-3">
          Explore Movies
        </Link>
      </div>

      {feedbackMessage && (
        <div className="alert alert-success cinema-card mb-4 d-flex align-items-center justify-content-between" role="alert">
          <span>{feedbackMessage}</span>
          <button type="button" className="btn-close btn-close-white" onClick={() => setFeedbackMessage('')}></button>
        </div>
      )}

      {error && (
        <div className="alert alert-danger cinema-card mb-4" role="alert">
          <AlertCircle size={18} className="me-2" />
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="cinema-card text-center p-5 my-4">
          <Film size={48} className="text-secondary mb-3 opacity-50" />
          <h4 className="text-white">No Bookings Yet</h4>
          <p className="text-secondary mb-4">You have not booked any movie tickets yet. Browse what's playing today!</p>
          <Link to="/" className="btn btn-cinema-red rounded-pill px-4 py-2">
            Book Your First Movie
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {bookings.map((booking) => {
            const movie = booking.show?.movie;
            const isCancelled = booking.status === 'cancelled';

            return (
              <div key={booking._id} className="col-lg-6">
                <div className={`cinema-card p-4 h-100 ${isCancelled ? 'opacity-75' : ''}`}>
                  <div className="d-flex gap-3 mb-3">
                    <img
                      src={movie?.poster}
                      alt={movie?.title}
                      className="rounded-3 object-fit-cover shadow-sm flex-shrink-0"
                      style={{ width: '90px', height: '130px', background: '#1e293b' }}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <h5 className="text-white fw-bold mb-1">{movie?.title || 'Movie'}</h5>
                        <span
                          className={`badge rounded-pill px-3 py-1 text-uppercase fw-bold ${
                            isCancelled ? 'bg-danger text-light' : 'bg-success text-white'
                          }`}
                          style={{ fontSize: '11px' }}
                        >
                          {booking.status}
                        </span>
                      </div>

                      <div className="text-warning small fw-semibold mb-1">{booking.show?.screen}</div>
                      <div className="text-secondary small d-flex flex-wrap gap-2 mb-2">
                        <span className="d-flex align-items-center gap-1">
                          <Calendar size={13} /> {booking.show?.date}
                        </span>
                        <span>•</span>
                        <span className="d-flex align-items-center gap-1 text-danger">
                          <Clock size={13} /> {booking.show?.time}
                        </span>
                      </div>

                      <div className="text-secondary small">
                        Booking ID: <span className="text-light fw-mono">{booking.bookingId}</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-secondary border-opacity-25" />

                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="text-secondary small">Seats:</div>
                      <div className="fw-bold text-light">
                        {booking.seats.map((s) => `${s.row}${s.number}`).join(', ')}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="text-secondary small">Total Paid:</div>
                      <div className="fw-bold text-warning fs-5">${booking.totalPrice}</div>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end pt-2 border-top border-secondary border-opacity-25">
                    <Link
                      to={`/ticket/${booking._id}`}
                      state={{ booking }}
                      className="btn btn-sm btn-outline-light rounded-pill px-3 d-flex align-items-center gap-1 border-secondary"
                    >
                      <Eye size={15} /> View Pass
                    </Link>

                    {!isCancelled && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="btn btn-sm btn-outline-danger rounded-pill px-3 d-flex align-items-center gap-1"
                      >
                        {cancellingId === booking._id ? (
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                        ) : (
                          <XCircle size={15} />
                        )}
                        <span>Cancel Booking</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
