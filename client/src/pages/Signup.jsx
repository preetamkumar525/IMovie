import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Film, AlertCircle } from 'lucide-react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
      <div className="cinema-card p-4 p-md-5 w-100" style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-2" style={{ background: 'linear-gradient(135deg, #e50914, #991b1b)' }}>
            <Film size={28} className="text-white" />
          </div>
          <h3 className="text-white fw-bold mb-1">Create Account</h3>
          <p className="text-secondary small">Join IMovies for seamless ticket bookings</p>
        </div>

        {error && (
          <div className="alert alert-danger cinema-card d-flex align-items-center gap-2 mb-3" role="alert">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <span className="small">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label text-secondary small">Full Name</label>
            <input
              type="text"
              required
              className="form-control bg-dark border-secondary text-white py-2"
              placeholder="e.g. Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary small">Email Address</label>
            <input
              type="email"
              required
              className="form-control bg-dark border-secondary text-white py-2"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label text-secondary small">Password</label>
            <input
              type="password"
              required
              className="form-control bg-dark border-secondary text-white py-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label className="form-label text-secondary small">Confirm Password</label>
            <input
              type="password"
              required
              className="form-control bg-dark border-secondary text-white py-2"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-cinema-red rounded-pill w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md"
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <UserPlus size={18} />
            )}
            <span>Register &amp; Continue</span>
          </button>
        </form>

        <div className="text-center text-secondary small mt-3">
          Already have an account?{' '}
          <Link to="/login" className="text-danger fw-semibold text-decoration-none">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
