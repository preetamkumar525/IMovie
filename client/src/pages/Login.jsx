import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Film, AlertCircle, Key, UserCheck, Shield } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickCredentials = (role) => {
    if (role === 'admin') {
      setEmail('admin@imovies.com');
      setPassword('admin123');
    } else {
      setEmail('user@imovies.com');
      setPassword('user123');
    }
  };

  return (
    <div className="container py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '75vh' }}>
      <div className="cinema-card p-4 p-md-5 w-100" style={{ maxWidth: '440px' }}>
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center p-3 rounded-circle mb-2" style={{ background: 'linear-gradient(135deg, #e50914, #991b1b)' }}>
            <Film size={28} className="text-white" />
          </div>
          <h3 className="text-white fw-bold mb-1">Welcome Back</h3>
          <p className="text-secondary small">Sign in to book tickets and manage reservations</p>
        </div>

        {error && (
          <div className="alert alert-danger cinema-card d-flex align-items-center gap-2 mb-3" role="alert">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <span className="small">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
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

          <div className="mb-4">
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

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-cinema-red rounded-pill w-100 py-2 d-flex align-items-center justify-content-center gap-2 mb-3 shadow-md"
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm" role="status"></span>
            ) : (
              <LogIn size={18} />
            )}
            <span>Sign In</span>
          </button>
        </form>

        {/* Quick Demo Login Helpers for One-Click Testing */}
        <div className="p-3 rounded-3 my-3" style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div className="text-secondary small text-center mb-2 fw-semibold">Quick Demo Logins:</div>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => fillQuickCredentials('admin')}
              className="btn btn-outline-warning btn-sm w-50 rounded-pill d-flex align-items-center justify-content-center gap-1"
            >
              <Shield size={14} /> Admin
            </button>
            <button
              type="button"
              onClick={() => fillQuickCredentials('user')}
              className="btn btn-outline-light btn-sm w-50 rounded-pill d-flex align-items-center justify-content-center gap-1 border-secondary"
            >
              <UserCheck size={14} /> Demo User
            </button>
          </div>
        </div>

        <div className="text-center text-secondary small mt-3">
          Don't have an account?{' '}
          <Link to="/signup" className="text-danger fw-semibold text-decoration-none">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
