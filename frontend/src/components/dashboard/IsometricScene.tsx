"use client";

export default function IsometricScene() {
  return (
    <div className="relative w-full h-full min-h-[280px] flex items-center justify-center animate-floating">
      {/* Floating shadow */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 rounded-full opacity-20"
        style={{ background: "radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)" }} />

      {/* Isometric Scene SVG */}
      <svg viewBox="0 0 400 300" className="w-full max-w-[360px] drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
        {/* Ground plane */}
        <polygon points="200,260 350,200 200,140 50,200" fill="#F5F5F5" stroke="#E5E7EB" strokeWidth="1" />

        {/* Command Center - Main Building */}
        <g transform="translate(150, 100)">
          {/* Front face */}
          <polygon points="50,60 100,35 100,95 50,120" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          {/* Side face */}
          <polygon points="0,35 50,60 50,120 0,95" fill="#F8F8F8" stroke="#E5E7EB" strokeWidth="1" />
          {/* Top face */}
          <polygon points="0,35 50,10 100,35 50,60" fill="#FF6B35" opacity="0.9" />
          {/* Window */}
          <rect x="15" y="55" width="15" height="12" rx="2" fill="#FF6B35" opacity="0.3" />
          <rect x="60" y="50" width="15" height="12" rx="2" fill="#FF6B35" opacity="0.3" />
          {/* Antenna */}
          <line x1="50" y1="10" x2="50" y2="-10" stroke="#FF6B35" strokeWidth="2" />
          <circle cx="50" cy="-12" r="3" fill="#FF6B35" opacity="0.8">
            <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>

        {/* Relief Tent 1 */}
        <g transform="translate(50, 150)">
          <polygon points="30,0 60,25 60,55 0,55 0,25" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <polygon points="30,0 0,25 60,25" fill="#FF6B35" opacity="0.8" />
          {/* Door */}
          <rect x="22" y="35" width="16" height="20" rx="8" fill="#FF8F63" opacity="0.5" />
          {/* Red cross */}
          <rect x="27" y="8" width="6" height="14" rx="1" fill="#FFFFFF" />
          <rect x="23" y="12" width="14" height="6" rx="1" fill="#FFFFFF" />
        </g>

        {/* Relief Tent 2 */}
        <g transform="translate(270, 155)">
          <polygon points="25,0 50,20 50,45 0,45 0,20" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <polygon points="25,0 0,20 50,20" fill="#FF6B35" opacity="0.7" />
          <rect x="18" y="28" width="14" height="17" rx="7" fill="#FF8F63" opacity="0.5" />
        </g>

        {/* Supply Truck */}
        <g transform="translate(80, 195)">
          {/* Cargo */}
          <rect x="15" y="0" width="45" height="25" rx="3" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="15" y="0" width="45" height="6" rx="2" fill="#FF6B35" opacity="0.6" />
          {/* Cab */}
          <rect x="0" y="8" width="18" height="17" rx="2" fill="#FF8F63" opacity="0.8" />
          {/* Wheels */}
          <circle cx="12" cy="28" r="4" fill="#374151" />
          <circle cx="48" cy="28" r="4" fill="#374151" />
          <circle cx="12" cy="28" r="2" fill="#6B7280" />
          <circle cx="48" cy="28" r="2" fill="#6B7280" />
        </g>

        {/* Volunteer figures */}
        {/* Person 1 */}
        <g transform="translate(180, 200)">
          <circle cx="6" cy="0" r="5" fill="#FF6B35" opacity="0.9" />
          <line x1="6" y1="5" x2="6" y2="20" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="10" x2="0" y2="16" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="10" x2="12" y2="16" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="2" y2="28" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="10" y2="28" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Person 2 */}
        <g transform="translate(240, 190)">
          <circle cx="6" cy="0" r="5" fill="#6366F1" opacity="0.8" />
          <line x1="6" y1="5" x2="6" y2="20" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="10" x2="0" y2="15" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="10" x2="12" y2="14" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="2" y2="28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="10" y2="28" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Person 3 */}
        <g transform="translate(140, 210)">
          <circle cx="6" cy="0" r="5" fill="#2DD4BF" opacity="0.8" />
          <line x1="6" y1="5" x2="6" y2="20" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="10" x2="0" y2="16" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="10" x2="12" y2="16" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="2" y2="28" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="20" x2="10" y2="28" stroke="#2DD4BF" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Supply crates */}
        <g transform="translate(300, 210)">
          <rect x="0" y="0" width="20" height="15" rx="2" fill="#FBBF24" opacity="0.6" stroke="#E5E7EB" strokeWidth="1" />
          <rect x="8" y="-12" width="18" height="13" rx="2" fill="#FF6B35" opacity="0.4" stroke="#E5E7EB" strokeWidth="1" />
        </g>

        {/* Communication dishes */}
        <g transform="translate(315, 120)">
          <line x1="10" y1="40" x2="10" y2="10" stroke="#9CA3AF" strokeWidth="2" />
          <ellipse cx="10" cy="8" rx="12" ry="6" fill="none" stroke="#FF6B35" strokeWidth="1.5" opacity="0.7" />
          {/* Signal waves */}
          <path d="M 25,5 Q 30,8 25,11" fill="none" stroke="#FF6B35" strokeWidth="1" opacity="0.5">
            <animate attributeName="opacity" values="0.2;0.7;0.2" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path d="M 30,2 Q 37,8 30,14" fill="none" stroke="#FF6B35" strokeWidth="1" opacity="0.3">
            <animate attributeName="opacity" values="0.1;0.5;0.1" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
          </path>
        </g>

        {/* Helicopter / drone */}
        <g transform="translate(280, 50)">
          <ellipse cx="15" cy="15" rx="10" ry="6" fill="#FF6B35" opacity="0.7" />
          <line x1="0" y1="10" x2="30" y2="10" stroke="#FF6B35" strokeWidth="1.5" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" values="0 15 10;10 15 10;0 15 10;-10 15 10;0 15 10" dur="0.5s" repeatCount="indefinite" />
          </line>
          <line x1="15" y1="15" x2="15" y2="21" stroke="#6B7280" strokeWidth="1" />
          <line x1="10" y1="21" x2="20" y2="21" stroke="#6B7280" strokeWidth="1.5" />
        </g>

        {/* NexSeva flag */}
        <g transform="translate(195, 80)">
          <line x1="0" y1="60" x2="0" y2="0" stroke="#9CA3AF" strokeWidth="1.5" />
          <rect x="1" y="2" width="22" height="14" rx="2" fill="#FF6B35" opacity="0.9">
            <animate attributeName="y" values="2;4;2" dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="5" y="12" fill="#FFFFFF" fontSize="6" fontWeight="bold">NS</text>
        </g>
      </svg>
    </div>
  );
}
