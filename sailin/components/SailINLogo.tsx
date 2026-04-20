type SailINLogoProps = {
  className?: string;
  showText?: boolean;
  size?: number;
};

export function SailINLogo({
  className = "",
  showText = true,
  size = 40,
}: SailINLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="flex items-center justify-center rounded-2xl border border-sky-200 bg-white shadow-sm"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 48 48" className="h-7 w-7 text-sky-600" fill="none">
          <path
            d="M24 8c5.5 0 10 4.5 10 10 0 6.2-5.2 9.6-10 15-4.8-5.4-10-8.8-10-15 0-5.5 4.5-10 10-10Z"
            fill="url(#sailin-gradient)"
          />
          <path
            d="M24 12v22"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <path
            d="M18 28c2.2-1.4 4.4-2 6-2s3.8.6 6 2"
            stroke="white"
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="currentColor"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient
              id="sailin-gradient"
              x1="10"
              y1="8"
              x2="38"
              y2="40"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#38bdf8" />
              <stop offset="0.55" stopColor="#60a5fa" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {showText ? (
        <div className="leading-tight">
          <div className="text-lg font-extrabold tracking-tight text-slate-900">
            SailIN
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
            Career Guidance
          </div>
        </div>
      ) : null}
    </div>
  );
}
