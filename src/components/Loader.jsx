
import ".././Utils/Loader.css"; // your CSS

export default function Loader({
  size = 80,
  color,
  spokes = 8,       // use 12 to match the screenshot; 8 also works
  duration = 0.9,
  className = "",
}) {
  const style = {
    width: size,
    height: size,
    color: color || "currentColor",
    "--duration": `${duration}s`, // pass duration to CSS
  };

  const step = 360 / spokes;

  return (
    <div
      className={`loader-spinner ${className}`}
      style={style}
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: spokes }).map((_, i) => (
        <div
          key={i}
          className="spoke"
          style={{ transform: `rotate(${i * step}deg)` }}
        >
          {/* Correctly phase-shift each spoke so there is no jump */}
          <i style={{ animationDelay: `${-(duration / spokes) * i}s` }} />
        </div>
      ))}
    </div>
  );
}