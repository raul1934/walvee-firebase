import React from "react";
import { Image as ImageIcon, MapPin } from "lucide-react";

export default function TripCardViewToggle({ activeView, onViewChange }) {
  return (
    <div className="trip-card-view-toggle">
      <style>{`
        .trip-card-view-toggle {
          position: absolute;
          bottom: -9px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .trip-card-view-toggle button {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .trip-card-view-toggle button:hover:not(.active) {
          background: rgba(0, 0, 0, 0.5);
          color: rgba(255, 255, 255, 0.9);
          transform: scale(1.05);
          border-color: rgba(255, 255, 255, 0.2);
        }

        .trip-card-view-toggle button.active {
          background: linear-gradient(135deg, #3B82F6 0%, #9333EA 100%);
          color: #fff;
          border-color: transparent;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.4);
        }

        .trip-card-view-toggle button:active {
          transform: scale(0.95);
        }

        @media (max-width: 768px) {
          .trip-card-view-toggle {
            gap: 16px;
            bottom: -5px;
          }

          .trip-card-view-toggle button {
            width: 52px;
            height: 52px;
          }
        }
      `}</style>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onViewChange('photos');
        }}
        className={activeView === 'photos' ? 'active' : ''}
        aria-label="View photos"
        aria-pressed={activeView === 'photos'}
      >
        <ImageIcon className="w-5 h-5" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onViewChange('itinerary');
        }}
        className={activeView === 'itinerary' ? 'active' : ''}
        aria-label="View itinerary"
        aria-pressed={activeView === 'itinerary'}
      >
        <MapPin className="w-5 h-5" />
      </button>
    </div>
  );
}