import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, Ticket, Shield, User, LogOut, Clapperboard } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg sticky-top border-bottom" style={{ backgroundColor: 'rgba(11, 15, 25, 0.92)', backdropFilter: 'blur(16px)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <div className="container">
        {/* Brand Logo */}
        <Link className="navbar-brand d-flex align-items-center gap-2 fw-bold fs-4 text-white" to="/">
          <div className="d-flex align-items-center justify-content-center rounded-3 p-1" style={{ background: 'linear-gradient(135deg, #e50914, #991b1b)' }}>
            <Clapperboard size={22} className="text-white" />
          </div>
          <span style={{ letterSpacing: '0.05em' }}>
            <span className="text-danger fw-extrabold">I</span>MOVIES
          </span>
        </Link>

        {/* Mobile Toggle Button */}
        <button
          className="navbar-toggler border-secondary"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3 gap-1">
            <li className="nav-item">
              <Link className="nav-link text-light d-flex align-items-center gap-1 opacity-75 opacity-hover" to="/">
                <Film size={16} /> Movies
              </Link>
            </li>
            {isAuthenticated && (
              <li className="nav-item">
                <Link className="nav-link text-light d-flex align-items-center gap-1 opacity-75 opacity-hover" to="/my-bookings">
                  <Ticket size={16} /> My Bookings
                </Link>
              </li>
            )}
            {isAdmin && (
              <li className="nav-item">
                <Link className="nav-link text-warning d-flex align-items-center gap-1 fw-semibold" to="/admin">
                  <Shield size={16} /> Admin Panel
                </Link>
              </li>
            )}
          </ul>

          {/* User Auth Buttons / Profile */}
          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center gap-2 rounded-pill px-3 py-1 text-light border-secondary"
                  type="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  style={{ background: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                    style={{ width: '26px', height: '26px', background: isAdmin ? '#f59e0b' : '#e50914', fontSize: '12px' }}
                  >
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="small fw-semibold">{user?.name}</span>
                </button>
                <ul className="dropdown-menu dropdown-menu-end cinema-card shadow-lg p-2 mt-2">
                  <li className="dropdown-header text-light fw-bold">
                    {user?.name}
                    <div className="text-secondary small fw-normal">{user?.email}</div>
                    {isAdmin && <span className="badge bg-warning text-dark mt-1">Admin</span>}
                  </li>
                  <li><hr className="dropdown-divider border-secondary" /></li>
                  <li>
                    <Link className="dropdown-item text-light rounded d-flex align-items-center gap-2 py-2" to="/my-bookings">
                      <Ticket size={16} /> My Bookings
                    </Link>
                  </li>
                  {isAdmin && (
                    <li>
                      <Link className="dropdown-item text-warning rounded d-flex align-items-center gap-2 py-2" to="/admin">
                        <Shield size={16} /> Admin Dashboard
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider border-secondary" /></li>
                  <li>
                    <button
                      className="dropdown-item text-danger rounded d-flex align-items-center gap-2 py-2"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2">
                <Link to="/login" className="btn btn-outline-light rounded-pill px-3 btn-sm">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-danger rounded-pill px-3 btn-sm fw-semibold">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
