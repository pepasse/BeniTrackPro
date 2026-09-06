interface RouteIllustrationProps {
  className?: string;
}

const RouteIllustration = ({ className }: RouteIllustrationProps) => (
  <svg viewBox="0 0 480 480" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Grille de fond, discrète */}
    <defs>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#24304a" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="480" height="480" fill="url(#grid)" opacity="0.4" />

    {/* Itinéraire */}
    <path
      d="M 60 380 C 120 380, 100 260, 170 240 C 250 216, 230 120, 320 100 C 370 88, 380 130, 420 110"
      stroke="#3fbfad"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="2 10"
    />
    <path
      d="M 60 380 C 120 380, 100 260, 170 240 C 250 216, 230 120, 320 100 C 370 88, 380 130, 420 110"
      stroke="#3fbfad"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="60 400"
      opacity="0.9"
    >
      <animate attributeName="stroke-dashoffset" from="0" to="-460" dur="6s" repeatCount="indefinite" />
    </path>

    {/* Points de passage */}
    <circle cx="60" cy="380" r="6" fill="#e7ecf5" />
    <circle cx="170" cy="240" r="5" fill="#8b96ac" />
    <circle cx="320" cy="100" r="5" fill="#8b96ac" />

    {/* Position actuelle du véhicule */}
    <circle cx="420" cy="110" r="9" fill="#0b1220" stroke="#e8a33d" strokeWidth="3" />
    <circle cx="420" cy="110" r="9" fill="none" stroke="#e8a33d" strokeWidth="2" opacity="0.6">
      <animate attributeName="r" from="9" to="24" dur="2s" repeatCount="indefinite" />
      <animate attributeName="opacity" from="0.6" to="0" dur="2s" repeatCount="indefinite" />
    </circle>
  </svg>
);

export default RouteIllustration;
