import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

export default function TravelerTips({ dayData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!dayData) return null;

  const periods = [
    { key: 'morning', label: 'Morning', data: dayData.morning },
    { key: 'lunch', label: 'Lunch', data: dayData.lunch },
    { key: 'afternoon', label: 'Afternoon', data: dayData.afternoon },
    { key: 'evening', label: 'Evening', data: dayData.evening },
    { key: 'night', label: 'Night', data: dayData.night }
  ].filter(period => period.data);

  if (periods.length === 0) return null;

  return (
    <div 
      className="traveler-tips-container"
      role="region"
      aria-label="AI-curated travel recommendations"
    >
      <style>{`
        .traveler-tips-container {
          position: relative;
          background: linear-gradient(135deg, #1A1F2E 0%, #242B3A 60%, #2A3142 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 18px 20px;
          margin-bottom: 16px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0px 4px 16px rgba(0, 0, 0, 0.3);
          overflow: hidden;
        }

        .traveler-tips-container::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(180deg, #3B82F6 0%, #9333EA 100%);
          opacity: 0.4;
          animation: gradientFlow 6s ease-in-out infinite alternate;
        }

        @keyframes gradientFlow {
          0% {
            opacity: 0.3;
            transform: scaleY(0.8);
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 0.4;
            transform: scaleY(1);
          }
        }

        .traveler-tips-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .traveler-tips-header:hover .traveler-tips-title {
          opacity: 0.8;
        }

        .traveler-tips-header-top {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .traveler-tips-icon {
          width: 18px;
          height: 18px;
          background: linear-gradient(135deg, #3B82F6 0%, #9333EA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          flex-shrink: 0;
        }

        .traveler-tips-title {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          font-weight: 600;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.9);
          letter-spacing: 0.2px;
          transition: opacity 0.2s ease;
          text-align: center;
        }

        .traveler-tips-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 12px;
          color: rgba(59, 130, 246, 0.9);
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .traveler-tips-toggle:hover {
          color: rgba(59, 130, 246, 1);
        }

        .traveler-tips-toggle svg {
          width: 16px;
          height: 16px;
          transition: transform 0.2s ease;
        }

        .traveler-tips-body {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.3s ease;
          overflow: hidden;
        }

        .traveler-tips-body.expanded {
          grid-template-rows: 1fr;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }

        .traveler-tips-body-inner {
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .traveler-tip-item {
          font-size: 14px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
        }

        .traveler-tip-label {
          font-weight: 600;
          background: linear-gradient(90deg, #60A5FA 0%, #A855F7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-right: 6px;
        }

        @media (max-width: 768px) {
          .traveler-tips-container {
            padding: 14px 16px;
          }

          .traveler-tip-item {
            font-size: 13px;
            line-height: 1.5;
          }

          .traveler-tips-title {
            font-size: 13px;
          }

          .traveler-tips-toggle {
            font-size: 11px;
          }

          .traveler-tips-body.expanded {
            margin-top: 12px;
            padding-top: 12px;
          }

          .traveler-tips-body-inner {
            gap: 10px;
          }
        }
      `}</style>

      <div 
        className="traveler-tips-header"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsExpanded(!isExpanded);
          }
        }}
      >
        <div className="traveler-tips-header-top">
          <Sparkles className="traveler-tips-icon" />
          <span className="traveler-tips-title">Travelers Tips — Curated by Walvee AI</span>
        </div>
        
        <div className="traveler-tips-toggle">
          <span>{isExpanded ? 'See less' : 'See more'}</span>
          {isExpanded ? (
            <ChevronUp />
          ) : (
            <ChevronDown />
          )}
        </div>
      </div>

      <div className={`traveler-tips-body ${isExpanded ? 'expanded' : ''}`}>
        <div className="traveler-tips-body-inner">
          {periods.map((period) => (
            <p key={period.key} className="traveler-tip-item">
              <span className="traveler-tip-label">{period.label}:</span>
              {period.data}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}