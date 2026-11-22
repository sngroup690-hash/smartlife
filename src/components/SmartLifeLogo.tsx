export default function SmartLifeLogo({ height = 44 }: { height?: number }) {
  const w = Math.round(height * 3.1);
  return (
    <svg width={w} height={height} viewBox="0 0 155 50" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="SMART LIFE">
      {/* Croissant noir (C shape) */}
      <path d="M28 5 C5 5 3 45 28 45" stroke="#111827" strokeWidth="7" strokeLinecap="round"/>
      {/* Swoosh vert extérieur */}
      <path d="M23 3 C74 -5 92 27 60 47" stroke="#27A827" strokeWidth="4" strokeLinecap="round"/>
      {/* SMART en vert */}
      <text x="34" y="27" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="21" fill="#27A827">SMART</text>
      {/* LIFE en jaune doré italique */}
      <text x="56" y="46" fontFamily="'Arial Black', Impact, sans-serif" fontWeight="900" fontSize="20" fontStyle="italic" fill="#E8B800">LIFE</text>
    </svg>
  );
}
