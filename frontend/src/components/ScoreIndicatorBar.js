export default function ScoreIndicatorBar({ width, score, color, player }) {
  const containerStyle = {
    width: `${Math.max(width, 10)}%`,
  };

  return (
    <div className="score-indicator-bar-container" style={containerStyle}>
      <div className="score-indicator-bar" style={{ backgroundColor: color }}>
        {/* This score display decision is just for win page proof of concept  */}
        {score} — {player.display_name}
      </div>
    </div>
  );
}
