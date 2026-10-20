import React from 'react';
import { X } from 'lucide-react';

const TrailerModal = ({ show, onClose, trailerKey, title }) => {
  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', zIndex: 1060 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content cinema-card border-secondary text-white shadow-2xl">
          <div className="modal-header border-secondary border-opacity-25 pb-2">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              <span className="text-danger">▶</span> {title} - Official Trailer
            </h5>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-circle d-flex align-items-center justify-content-center p-1 text-light"
              onClick={onClose}
              style={{ width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-0">
            {trailerKey ? (
              <div className="ratio ratio-16x9">
                <iframe
                  src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
                  title={`${title} Trailer`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="p-5 text-center text-secondary">
                <p>Trailer not available for this movie.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrailerModal;
