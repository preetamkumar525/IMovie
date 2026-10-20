import React from 'react';
import { Film, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-top mt-5 py-4" style={{ backgroundColor: '#090d16', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <div className="container text-center text-md-start">
        <div className="row align-items-center gy-3">
          <div className="col-md-6">
            <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-1">
              <Film size={20} className="text-danger" />
              <span className="fw-bold fs-5 text-white">IMOVIES</span>
              <span className="badge bg-danger ms-2 small">Cinema 2026</span>
            </div>
            <p className="text-secondary small mb-0">
              Next-generation movie ticket booking web app powered by MERN &amp; real-time Socket.io.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end text-secondary small">
            <div>
              Built with <Heart size={14} className="text-danger mx-1 fill-danger" /> for movie lovers worldwide
            </div>
            <div className="mt-1 opacity-75">
              &copy; {new Date().getFullYear()} IMovies Cinema Entertainment Inc. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
