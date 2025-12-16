
import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Star, Building2, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Category configuration
const CATEGORY_CONFIG = {
  city: {
    icon: MapPin,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  place: {
    icon: Compass,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  activity: {
    icon: Compass,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  },
  business: {
    icon: Building2,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  }
};

// Card size patterns for masonry layout
const SIZE_PATTERNS = [
  // Pattern repeats every 9 cards
  'small', 'tall', 'small', 
  'small', 'small', 'tall',
  'tall', 'small', 'small'
];

export default function MiniCardGrid({ recommendations, onCardClick }) {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  console.log('[MiniCardGrid] Rendering recommendations:', recommendations.map(r => ({ name: r.name, type: r.type })));

  return (
    <div className="mini-card-grid-wrapper">
      <style>{`
        .mini-card-grid-wrapper {
          width: 100%;
          max-width: 650px;
        }

        .mini-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 8px;
          width: 100%;
        }

        .mini-card {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          background: linear-gradient(135deg, #1A1B23, #0F1015);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.2s ease;
          padding: 0; /* Ensure button padding is reset */
          text-align: left; /* Ensure text alignment is consistent */
        }

        .mini-card:hover {
          transform: translateY(-2px);
          border-color: rgba(70, 123, 255, 0.4);
          box-shadow: 0 8px 24px rgba(70, 123, 255, 0.15);
        }

        .mini-card.small {
          height: 110px;
        }

        .mini-card.tall {
          height: 229px;
          grid-row: span 2;
        }

        .mini-card-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .mini-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, transparent 0%, rgba(0, 0, 0, 0.7) 100%);
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .mini-card-category {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          backdrop-filter: blur(8px);
        }

        .mini-card-footer {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mini-card-title {
          font-size: 13px;
          font-weight: 700;
          color: white;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .mini-card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }

        .mini-card-rating {
          display: flex;
          align-items: center;
          gap: 2px;
          color: white;
          font-weight: 600;
        }

        .mini-card-price {
          color: #10B981;
          font-weight: 700;
        }

        .show-more-btn {
          margin-top: 12px;
          width: 100%;
          max-width: 200px;
        }

        @media (max-width: 640px) {
          .mini-card-grid {
            grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
            gap: 6px;
          }

          .mini-card.small {
            height: 90px;
          }

          .mini-card.tall {
            height: 186px;
          }

          .mini-card-title {
            font-size: 11px;
          }

          .mini-card-meta {
            font-size: 10px;
          }
        }
      `}</style>

      <div className="mini-card-grid">
        {recommendations.map((rec, idx) => {
          const sizeClass = SIZE_PATTERNS[idx % SIZE_PATTERNS.length];
          const category = CATEGORY_CONFIG[rec.type] || CATEGORY_CONFIG.place;
          const Icon = category.icon;

          // Mock data - in production, fetch from Google Places
          const mockRating = (4.2 + Math.random() * 0.8).toFixed(1);
          const mockPrice = ['$', '$$', '$$$'][Math.floor(Math.random() * 3)];

          return (
            <motion.button
              key={idx}
              className={`mini-card ${sizeClass}`}
              onClick={() => {
                console.log('[MiniCardGrid] Card clicked:', { name: rec.name, type: rec.type });
                onCardClick(rec);
              }}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: idx * 0.03 }}
            >
              {/* Placeholder image - replace with actual image from Google Places */}
              <div className="mini-card-image" style={{
                background: `linear-gradient(135deg, ${
                  category.color.includes('blue') ? '#1E40AF' :
                  category.color.includes('purple') ? '#7C3AED' :
                  category.color.includes('green') ? '#059669' :
                  '#EA580C'
                }, #000)`
              }} />

              <div className="mini-card-overlay">
                <div className={`mini-card-category ${category.bgColor}`}>
                  <Icon className={`w-3 h-3 ${category.color}`} />
                </div>

                <div className="mini-card-footer">
                  <h4 className="mini-card-title">{rec.name}</h4>
                  <div className="mini-card-meta">
                    <div className="mini-card-rating">
                      <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                      <span>{mockRating}</span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <span className="mini-card-price">{mockPrice}</span>
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
