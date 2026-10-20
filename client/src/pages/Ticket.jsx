import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import { CheckCircle2, Printer, Ticket as TicketIcon, Calendar, Clock, MapPin, Film, ArrowRight } from 'lucide-react';

const Ticket = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!booking);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!booking && id) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const { data } = await api.get(`/bookings/${id}`);
          if (data.success) {
            setBooking(data.data);
          }
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to retrieve ticket');
        } finally {
          setLoading(false);
        }
      };

      fetchBooking();
    }
  }, [id, booking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="text-secondary mt-3">Rendering your digital admission pass...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger cinema-card d-inline-block p-4">
          <h5>Ticket Not Available</h5>
          <p className="text-secondary small">{error || 'Could not find booking with this identification.'}</p>
          <Link to="/my-bookings" className="btn btn-outline-light rounded-pill px-4 mt-2">
            View My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const { show, seats, totalPrice, bookingId, createdAt, status } = booking;
  const movie = show?.movie;

  // Payload for QR Code
  const qrPayload = JSON.stringify({
    bookingId,
    movie: movie?.title,
    screen: show?.screen,
    date: show?.date,
    time: show?.time,
    seats: seats.map((s) => `${s.row}${s.number}`).join(', '),
  });

  return (
    <div className="container py-5">
      {/* Success banner */}
      <div className="text-center mb-4">
        <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-success bg-opacity-10 text-success mb-2">
          <CheckCircle2 size={42} />
        </div>
        <h2 className="text-white fw-bold">Booking Confirmed!</h2>
        <p className="text-secondary">Your admission ticket has been generated. Please show this at the entrance.</p>
      </div>

      {/* Printable Digital Cinema Pass */}
      <div className="row justify-content-center">
        <div className="col-md-9 col-lg-7 col-xl-6">
          <div className="digital-ticket text-white p-4 p-md-5">
            {/* Perforation Notches */}
            <div className="ticket-notch-left"></div>
            <div className="ticket-notch-right"></div>

            {/* Header: Brand & Status */}
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div className="d-flex align-items-center gap-2">
                <Film className="text-danger" size={24} />
                <span className="fw-black fs-4 text-white" style={{ letterSpacing: '0.05em' }}>
                  <span className="text-danger">I</span>MOVIES CINEMAS
                </span>
              </div>
              <span className={`badge ${status === 'confirmed' ? 'bg-success' : 'bg-danger'} rounded-pill px-3 py-2 text-uppercase fw-bold`}>
                {status}
              </span>
            </div>

            {/* Movie Info */}
            <div className="d-flex gap-4 align-items-center mb-4">
              <img
                src={movie?.poster}
                alt={movie?.title}
                className="rounded-3 shadow-md object-fit-cover"
                style={{ width: '90px', height: '125px' }}
              />
              <div>
                <h4 className="fw-bold mb-1 text-white">{movie?.title}</h4>
                <div className="text-warning small fw-semibold mb-2">{show?.screen}</div>
                <div className="text-secondary small">
                  Booking ID: <strong className="text-light">{bookingId}</strong>
                </div>
              </div>
            </div>

            {/* Screening Details Grid */}
            <div className="row g-3 py-3 border-top border-bottom border-secondary border-opacity-25 my-2">
              <div className="col-6">
                <div className="text-secondary small d-flex align-items-center gap-1">
                  <Calendar size={14} /> Date
                </div>
                <div className="fw-bold fs-6 text-white">{show?.date}</div>
              </div>
              <div className="col-6">
                <div className="text-secondary small d-flex align-items-center gap-1">
                  <Clock size={14} /> Showtime
                </div>
                <div className="fw-bold fs-6 text-danger">{show?.time}</div>
              </div>
              <div className="col-6">
                <div className="text-secondary small d-flex align-items-center gap-1">
                  <TicketIcon size={14} /> Seats ({seats.length})
                </div>
                <div className="fw-bold fs-6 text-warning">
                  {seats.map((s) => `${s.row}${s.number}`).join(', ')}
                </div>
              </div>
              <div className="col-6">
                <div className="text-secondary small">Total Paid</div>
                <div className="fw-bold fs-6 text-success">${totalPrice}</div>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="ticket-divider"></div>

            {/* QR Code and Barcode Section */}
            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between gap-4 pt-2">
              <div className="text-center text-sm-start">
                <div className="fw-bold text-white mb-1">SCAN FOR AUDITORIUM ENTRY</div>
                <div className="text-secondary small" style={{ maxWidth: '240px' }}>
                  Present this QR code at the ticket scanner gate at {show?.screen}.
                </div>
                <div className="text-secondary small opacity-50 mt-2">
                  Issued: {new Date(createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* QR Code */}
              <div className="p-3 bg-white rounded-3 shadow-sm d-flex align-items-center justify-content-center">
                <QRCodeSVG value={qrPayload} size={110} level="M" />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="d-flex flex-wrap gap-3 justify-content-center mt-4">
            <button
              onClick={handlePrint}
              className="btn btn-outline-light rounded-pill px-4 py-2 d-flex align-items-center gap-2 border-secondary"
            >
              <Printer size={18} /> Print / Save Ticket
            </button>
            <Link
              to="/my-bookings"
              className="btn btn-cinema-red rounded-pill px-4 py-2 d-flex align-items-center gap-2"
            >
              <span>View My Bookings</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ticket;
