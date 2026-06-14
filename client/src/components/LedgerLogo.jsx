export default function LedgerLogo({ size = 32, className = '', style = {} }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* Book body */}
      <rect x="6" y="4" width="36" height="40" rx="4" fill="#8B3DFF" />
      {/* Spine */}
      <rect x="6" y="4" width="10" height="40" rx="4" fill="#6B21A8" />
      <rect x="12" y="4" width="4" height="40" fill="#6B21A8" />
      {/* Dollar sign */}
      <text x="28" y="30" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="20" fill="white" opacity="0.95">$</text>
      {/* Bottom accent */}
      <rect x="20" y="37" width="16" height="2.5" rx="1.25" fill="white" opacity="0.3" />
    </svg>
  );
}
