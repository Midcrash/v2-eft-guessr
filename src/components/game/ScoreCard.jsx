import React from "react";
import "./ScoreCard.css";

const ScoreCard = ({ score, distance, formattedDistance, rating }) => {
  // Get score percentage (5000 is max score)
  const percentage = Math.min(100, Math.round((score / 5000) * 100));

  // Get visual indicators based on score
  const getScoreColor = () => {
    if (percentage >= 90) return "var(--accent-red-bright)";
    if (percentage >= 70) return "#c27c0e";
    if (percentage >= 50) return "#a67c52";
    if (percentage >= 30) return "#7a6346";
    return "var(--text-dark)";
  };

  return (
    <div className="score-card">
      <div className="score-header">
        <h3>Round Result</h3>
      </div>

      <div className="score-content">
        <div className="score-points">
          <span className="score-number" style={{ color: getScoreColor() }}>
            {score}
          </span>
          <span className="score-label">points</span>
        </div>

        <div className="score-rating">
          <span
            className="rating-badge"
            style={{ backgroundColor: getScoreColor() }}
          >
            {rating}
          </span>
        </div>

        <div className="score-details">
          <div className="distance-metric">
            <div className="metric-label">Distance</div>
            <div className="metric-value">{formattedDistance}</div>
          </div>

          <div className="score-bar-container">
            <div className="score-bar-bg">
              <div
                className="score-bar-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: getScoreColor(),
                }}
              ></div>
            </div>
            <div className="score-bar-markers">
              <span>0</span>
              <span>2500</span>
              <span>5000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoreCard;
