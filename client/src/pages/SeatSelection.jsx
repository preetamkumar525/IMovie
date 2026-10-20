import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Clock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

const SeatSelection = () => {
  const { id: showId } = useParams();
  const navigate = useNavigate();
  const { socket, joinShow, leaveShow } = useSocket();
  const { isAuthenticated, user } = useAuth();

  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]); // array of { row, number, type, price }
  const [loading, setLoading] = useState(true);
  const [holding, setHolding] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch Show Seats
  const fetchShowData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/shows/${showId}/seats`);
      if (data.success) {
        setShow(data.data);
        setSeats(data.data.seats);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to load auditorium seating');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowData();
  }, [showId]);

  // 2. Real-time Socket.io Room & Updates
  useEffect(() => {
    if (!showId) return;

    joinShow(showId);

    if (socket) {
      const handleSeatUpdate = (payload) => {
        // console.log('⚡ Received real-time seat update:', payload);
        const { eventType, seats: updatedSeats, heldBy } = payload;

        setSeats((prevSeats) => {
          return prevSeats.map((seat) => {
            const isMatch = (updatedSeats || []).some(
              (us) => us.row === seat.row && Number(us.number) === seat.number
            );

            if (!isMatch) return seat;

            if (eventType === 'held') {
              const isHeldByCurrent = user && heldBy && heldBy.toString() === user.id;
              return {
                ...seat,
                status: 'held',
                isHeldByMe: Boolean(isHeldByCurrent),
              };
            }

            if (eventType === 'booked') {
              return {
                ...seat,
                status: 'booked',
                isHeldByMe: false,
              };
            }

            if (eventType === 'released') {
              return {
                ...seat,
                status: 'available',
                isHeldByMe: false,
              };
            }

            return seat;
          });
        });

        // If another user held or booked one of our selected seats, unselect it and notify
        if (eventType === 'held' || eventType === 'booked') {
          setSelectedSeats((prevSelected) => {
            const conflicting = prevSelected.filter((sel) =>
              (updatedSeats || []).some((us) => us.row === sel.row && Number(us.number) === sel.number)
            );
            if (conflicting.length > 0 && heldBy !== user?.id) {
              setErrorMessage(`Note: Seat ${conflicting.map((c) => c.row + c.number).join(', ')} was just reserved by another guest.`);
            }
            return prevSelected.filter(
              (sel) => !(updatedSeats || []).some((us) => us.row === sel.row && Number(us.number) === sel.number && heldBy !== user?.id)
            );
          });
        }
      };

      socket.on('seatUpdate', handleSeatUpdate);

      return () => {
        socket.off('seatUpdate', handleSeatUpdate);
        leaveShow(showId);
      };
    }
  }, [socket, showId, user]);

  // Seat toggle handler
  const toggleSeatSelection = (seat) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'held' && !seat.isHeldByMe) return;

    setErrorMessage('');

    const exists = selectedSeats.some((s) => s.row === seat.row && s.number === seat.number);

    if (exists) {
      setSelectedSeats(selectedSeats.filter((s) => !(s.row === seat.row && s.number === seat.number)));
    } else {
      if (selectedSeats.length >= 10) {
        setErrorMessage('You can select a maximum of 10 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  // Group seats by row for layout rendering
  const seatsByRow = useMemo(() => {
    const rowsMap = {};
    seats.forEach((seat) => {
      if (!rowsMap[seat.row]) {
        rowsMap[seat.row] = [];
      }
      rowsMap[seat.row].push(seat);
    });
    // Sort seats in each row by number
    Object.keys(rowsMap).forEach((r) => {
      rowsMap[r].sort((a, b) => a.number - b.number);
    });
    return rowsMap;
  }, [seats]);

  // Total price calculation
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

  // Proceed to hold and payment
  const handleProceedToPayment = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/shows/${showId}/seats` } });
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMessage('Please select at least one seat before continuing.');
      return;
    }

    try {
      setHolding(true);
      setErrorMessage('');

      // Call API to hold seats for 5 minutes
      const { data } = await api.post(`/shows/${showId}/hold`, {
        seats: selectedSeats.map((s) => ({ row: s.row, number: s.number })),
      });

      if (data.success) {
        // Navigate to payment page with show details and hold data
        navigate('/payment', {
          state: {
            showId: show._id,
            showInfo: {
              date: show.date,
              time: show.time,
              screen: show.screen,
              movie: show.movie,
            },
            heldSeats: data.seats,
            totalPrice,
            heldUntil: data.heldUntil,
            expiresInSeconds: data.expiresInSeconds,
          },
        });
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Failed to hold seats. Please choose other seats.');
      // Refresh seat layout
      fetchShowData();
    } finally {
      setHolding(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-danger" style={{ width: '3rem', height: '3rem' }} role="status"></div>
        <p className="text-secondary mt-3">Loading real-time auditorium map...</p>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger cinema-card d-inline-block p-4">
          <h5>Auditorium not found</h5>
          <button onClick={() => navigate('/')} className="btn btn-outline-light rounded-pill mt-2">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Top Navigation & Show Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-25">
        <div className="d-flex align-items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center border-secondary"
            style={{ width: '38px', height: '38px' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h4 className="text-white fw-bold mb-0">{show.movie?.title}</h4>
            <div className="text-secondary small d-flex flex-wrap align-items-center gap-2 mt-1">
              <span>{show.date}</span>
              <span>•</span>
              <span className="text-danger fw-semibold">{show.time}</span>
              <span>•</span>
              <span className="badge bg-dark border border-secondary text-warning">{show.screen}</span>
            </div>
          </div>
        </div>

        {/* Live sync badge */}
        <div className="d-flex align-items-center gap-2 text-success small cinema-card px-3 py-1 border-success border-opacity-25">
          <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
          <span>Real-time Live Seating</span>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="alert alert-warning cinema-card d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertCircle size={20} className="text-warning flex-shrink-0" />
          <span className="small">{errorMessage}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Main Seat Map Area */}
        <div className="col-lg-8">
          <div className="cinema-card p-4 text-center">
            {/* Curved Screen Graphic */}
            <div className="cinema-screen-container">
              <div className="cinema-screen-curve"></div>
              <div className="cinema-screen-glow"></div>
              <span className="text-secondary small fw-bold mt-2" style={{ letterSpacing: '0.25em' }}>
                ALL EYES THIS WAY • SCREEN
              </span>
            </div>

            {/* Seat Grid */}
            <div className="overflow-x-auto py-3">
              <div className="d-inline-block text-center" style={{ minWidth: '460px' }}>
                {Object.keys(seatsByRow).map((rowLetter) => {
                  const rowSeats = seatsByRow[rowLetter];
                  const seatType = rowSeats[0]?.type || 'Silver';

                  return (
                    <div key={rowLetter} className="d-flex align-items-center justify-content-center mb-2">
                      {/* Row Label */}
                      <span className="fw-bold text-secondary me-3" style={{ width: '20px', fontSize: '13px' }}>
                        {rowLetter}
                      </span>

                      {/* Seats in Row */}
                      <div className="d-flex">
                        {rowSeats.map((seat) => {
                          const isSelected = selectedSeats.some(
                            (s) => s.row === seat.row && s.number === seat.number
                          );
                          const isBooked = seat.status === 'booked';
                          const isHeld = seat.status === 'held';
                          const isHeldByMe = seat.isHeldByMe;

                          let seatClass = `seat-${seat.type.toLowerCase()}`;
                          if (isSelected) seatClass = 'seat-selected';
                          else if (isHeldByMe) seatClass = 'seat-held-by-me';
                          else if (isHeld) seatClass = 'seat-held';
                          else if (isBooked) seatClass = 'seat-booked';

                          // Optional aisle gap after seat 3 and 9
                          const isAisleGap = seat.number === 3 || seat.number === 9;

                          return (
                            <React.Fragment key={`${seat.row}-${seat.number}`}>
                              <button
                                type="button"
                                disabled={isBooked || (isHeld && !isHeldByMe)}
                                onClick={() => toggleSeatSelection(seat)}
                                className={`seat-btn ${seatClass}`}
                                title={`Row ${seat.row}, Seat ${seat.number} (${seat.type} - $${seat.price})`}
                              >
                                {seat.number}
                              </button>
                              {isAisleGap && <div style={{ width: '16px' }}></div>}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Row Label Right */}
                      <span className="fw-bold text-secondary ms-3" style={{ width: '20px', fontSize: '13px' }}>
                        {rowLetter}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Seat Legend */}
            <div className="d-flex flex-wrap justify-content-center gap-3 pt-4 mt-3 border-top border-secondary border-opacity-25 small">
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-silver" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Silver ($150)</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-gold" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Gold ($220)</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-premium" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Premium ($320)</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-selected" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Selected</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-held" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Held (5m)</span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="seat-btn seat-booked" style={{ width: '18px', height: '18px', margin: 0 }}></span>
                <span className="text-secondary">Booked</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Selected Seats Summary */}
        <div className="col-lg-4">
          <div className="cinema-card p-4 sticky-top" style={{ top: '90px' }}>
            <h5 className="text-white fw-bold mb-3 d-flex align-items-center gap-2">
              <Sparkles size={18} className="text-danger" /> Booking Summary
            </h5>

            <div className="mb-3">
              <div className="text-white fw-semibold">{show.movie?.title}</div>
              <div className="text-secondary small">{show.screen}</div>
              <div className="text-secondary small">{show.date} • {show.time}</div>
            </div>

            <hr className="border-secondary border-opacity-25" />

            {/* Selected Seats List */}
            <div className="mb-3">
              <div className="text-secondary small mb-2">Selected Seats ({selectedSeats.length}):</div>
              {selectedSeats.length === 0 ? (
                <div className="text-secondary-emphasis small p-3 rounded-3 text-center" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  No seats selected yet. Click on the layout to choose your seats.
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {selectedSeats.map((s) => (
                    <span
                      key={`${s.row}-${s.number}`}
                      className="badge bg-danger rounded-pill px-3 py-2 d-flex align-items-center gap-1"
                    >
                      <span>{s.row}{s.number}</span>
                      <span className="opacity-75">(${s.price})</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-secondary border-opacity-25" />

            {/* Price breakdown */}
            <div className="mb-4">
              <div className="d-flex justify-content-between text-secondary small mb-1">
                <span>Tickets Subtotal</span>
                <span>${totalPrice}</span>
              </div>
              <div className="d-flex justify-content-between text-secondary small mb-1">
                <span>Convenience Fee</span>
                <span>$0.00 (Free)</span>
              </div>
              <div className="d-flex justify-content-between text-white fw-bold fs-5 mt-2 pt-2 border-top border-secondary border-opacity-25">
                <span>Total Amount</span>
                <span className="text-warning">${totalPrice}</span>
              </div>
            </div>

            {/* 5-minute hold notice */}
            <div className="p-3 rounded-3 mb-4 d-flex align-items-center gap-2 text-secondary small" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Clock size={18} className="text-warning flex-shrink-0" />
              <span>Seats are held for <strong>5 minutes</strong> upon checkout to complete your transaction.</span>
            </div>

            {/* Action button */}
            <button
              onClick={handleProceedToPayment}
              disabled={selectedSeats.length === 0 || holding}
              className="btn btn-cinema-gold rounded-pill w-100 py-3 d-flex align-items-center justify-content-center gap-2 shadow-lg"
            >
              {holding ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                  <span>Reserving Seats...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={20} />
                  <span>Proceed to Payment (${totalPrice})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelection;
