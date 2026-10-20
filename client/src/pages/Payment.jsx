import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import confetti from 'canvas-confetti';
import { CreditCard, Clock, AlertCircle, ShieldCheck, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state;

  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardName, setCardName] = useState('Alex Johnson');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('789');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 5-minute countdown timer state
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!stateData?.heldUntil) return 300;
    const diff = Math.floor((new Date(stateData.heldUntil).getTime() - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  });

  // Redirect if no booking state
  useEffect(() => {
    if (!stateData || !stateData.showId || !stateData.heldSeats) {
      navigate('/');
    }
  }, [stateData, navigate]);

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle timer expiration
  useEffect(() => {
    if (timeLeft === 0 && stateData) {
      alert('Your 5-minute seat hold has expired. The seats have been released.');
      navigate(`/shows/${stateData.showId}/seats`);
    }
  }, [timeLeft, stateData, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      setExpiry(`${raw.slice(0, 2)}/${raw.slice(2)}`);
    } else {
      setExpiry(raw);
    }
  };

  // Submit payment and confirm booking
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setProcessing(true);

    try {
      // Simulate gateway processing delay
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const payload = {
        showId: stateData.showId,
        seats: stateData.heldSeats.map((s) => ({ row: s.row, number: s.number })),
        paymentDetails: {
          method: paymentMethod === 'card' ? 'Credit/Debit Card' : paymentMethod.toUpperCase(),
          transactionId: `TXN-${Date.now().toString(36).toUpperCase()}`,
        },
      };

      const { data } = await api.post('/bookings', payload);

      if (data.success) {
        // Fire confetti celebration!
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Navigate to Ticket page
        navigate(`/ticket/${data.data._id}`, { state: { booking: data.data } });
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'Payment verification failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  if (!stateData) return null;

  const { showInfo, heldSeats, totalPrice } = stateData;

  return (
    <div className="container py-5">
      {/* Back button & Title */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-outline-light rounded-pill btn-sm d-flex align-items-center gap-1 border-secondary"
        >
          <ArrowLeft size={16} /> Back to Seating
        </button>

        {/* Hold Countdown Badge */}
        <div
          className={`d-flex align-items-center gap-2 px-3 py-1 rounded-pill cinema-card border ${
            timeLeft < 60 ? 'border-danger text-danger animate-pulse' : 'border-warning text-warning'
          }`}
        >
          <Clock size={16} />
          <span className="small fw-bold">Hold Expires in: {formatTime(timeLeft)}</span>
        </div>
      </div>

      {errorMessage && (
        <div className="alert alert-danger cinema-card d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertCircle size={20} className="text-danger flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="row g-4">
        {/* Payment Form */}
        <div className="col-lg-7">
          <div className="cinema-card p-4">
            <h4 className="text-white fw-bold mb-4 d-flex align-items-center gap-2">
              <CreditCard className="text-danger" size={24} /> Payment Details
            </h4>

            {/* Payment Method Switcher */}
            <div className="btn-group w-100 mb-4" role="group">
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`btn py-2 ${paymentMethod === 'card' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
              >
                Credit / Debit Card
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`btn py-2 ${paymentMethod === 'upi' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
              >
                Instant UPI / QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`btn py-2 ${paymentMethod === 'wallet' ? 'btn-danger fw-bold' : 'btn-outline-secondary text-light'}`}
              >
                Cinema Wallet
              </button>
            </div>

            {/* Interactive Card Visual Preview */}
            {paymentMethod === 'card' && (
              <div
                className="p-4 rounded-4 mb-4 text-white shadow-lg position-relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  minHeight: '180px',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <span className="fw-bold tracking-wider fs-5" style={{ letterSpacing: '0.1em' }}>IMOVIES VIP CARD</span>
                  <span className="badge bg-warning text-dark fw-bold">SECURE GATEWAY</span>
                </div>
                <div className="fs-4 fw-mono mb-3" style={{ letterSpacing: '0.15em', fontFamily: 'monospace' }}>
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="d-flex justify-content-between align-items-end text-light small">
                  <div>
                    <div className="opacity-75" style={{ fontSize: '10px' }}>CARDHOLDER</div>
                    <div className="fw-semibold text-uppercase">{cardName || 'YOUR NAME'}</div>
                  </div>
                  <div>
                    <div className="opacity-75" style={{ fontSize: '10px' }}>EXPIRES</div>
                    <div className="fw-semibold">{expiry || 'MM/YY'}</div>
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' ? (
              <form onSubmit={handlePaymentSubmit}>
                <div className="mb-3">
                  <label className="form-label text-secondary small">Card Number</label>
                  <input
                    type="text"
                    required
                    className="form-control bg-dark border-secondary text-white py-2"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small">Cardholder Name</label>
                  <input
                    type="text"
                    required
                    className="form-control bg-dark border-secondary text-white py-2"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-6">
                    <label className="form-label text-secondary small">Expiration (MM/YY)</label>
                    <input
                      type="text"
                      required
                      className="form-control bg-dark border-secondary text-white py-2"
                      placeholder="MM/YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-secondary small">CVV</label>
                    <input
                      type="password"
                      required
                      maxLength="4"
                      className="form-control bg-dark border-secondary text-white py-2"
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="p-3 rounded-3 mb-4 d-flex align-items-center gap-2 text-secondary small" style={{ background: 'rgba(255, 255, 255, 0.03)' }}>
                  <Lock size={16} className="text-success flex-shrink-0" />
                  <span>256-bit encrypted simulated test transaction. No real charges apply.</span>
                </div>

                <button
                  type="submit"
                  disabled={processing || timeLeft === 0}
                  className="btn btn-cinema-gold rounded-pill w-100 py-3 d-flex align-items-center justify-content-center gap-2 fw-bold fs-5 shadow-lg"
                >
                  {processing ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={22} />
                      <span>Pay ${totalPrice} &amp; Confirm Booking</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="p-4 text-center">
                <CheckCircle2 size={40} className="text-success mb-3" />
                <h5 className="text-white">Instant Mock One-Click Checkout</h5>
                <p className="text-secondary small mb-4">
                  Click below to immediately authorize this reservation via simulated {paymentMethod.toUpperCase()}.
                </p>
                <button
                  type="button"
                  disabled={processing || timeLeft === 0}
                  onClick={handlePaymentSubmit}
                  className="btn btn-cinema-gold rounded-pill px-5 py-3 fw-bold shadow-lg"
                >
                  {processing ? 'Confirming...' : `Pay $${totalPrice} via ${paymentMethod.toUpperCase()}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="col-lg-5">
          <div className="cinema-card p-4">
            <h5 className="text-white fw-bold mb-3">Order Details</h5>

            <div className="d-flex gap-3 mb-3">
              <img
                src={showInfo.movie?.poster}
                alt={showInfo.movie?.title}
                className="rounded-3 object-fit-cover shadow-sm"
                style={{ width: '80px', height: '110px' }}
              />
              <div>
                <h6 className="text-white fw-bold mb-1">{showInfo.movie?.title}</h6>
                <div className="text-secondary small mb-1">{showInfo.screen}</div>
                <div className="text-warning small fw-semibold">{showInfo.date} • {showInfo.time}</div>
              </div>
            </div>

            <hr className="border-secondary border-opacity-25" />

            <div className="mb-3">
              <div className="text-secondary small mb-2">Reserved Seats:</div>
              <div className="d-flex flex-wrap gap-2">
                {heldSeats.map((seat) => (
                  <span key={`${seat.row}-${seat.number}`} className="badge bg-danger rounded-pill px-3 py-2">
                    Row {seat.row} - Seat {seat.number} ({seat.type}) - ${seat.price}
                  </span>
                ))}
              </div>
            </div>

            <hr className="border-secondary border-opacity-25" />

            <div className="d-flex justify-content-between text-secondary small mb-2">
              <span>Tickets Subtotal</span>
              <span>${totalPrice}</span>
            </div>
            <div className="d-flex justify-content-between text-secondary small mb-2">
              <span>Booking Fee</span>
              <span className="text-success">FREE</span>
            </div>
            <div className="d-flex justify-content-between text-secondary small mb-3">
              <span>Taxes</span>
              <span>$0.00</span>
            </div>

            <div className="d-flex justify-content-between text-white fw-bold fs-4 pt-3 border-top border-secondary border-opacity-25">
              <span>Total Payable</span>
              <span className="text-warning">${totalPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
