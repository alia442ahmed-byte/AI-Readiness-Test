/* ScoreGauge.tsx — Animated SVG half-circle gauge
   Design: Electric blue arc on dark slate, spring-animated fill */

import { useEffect, useRef, useState } from "react";

interface ScoreGaugeProps {
  score: number; // 0–100
  size?: number;
}

function getScoreColor(score: number): string {
  if (score <= 40) return "#EF4444"; // red
  if (score <= 75) return "#F59E0B"; // amber
  return "#3B82F6"; // blue
}

function getScoreLabel(score: number): { tier: string; color: string } {
  if (score <= 40) return { tier: "High Risk", color: "#EF4444" };
  if (score <= 75) return { tier: "Moderate Risk", color: "#F59E0B" };
  return { tier: "Optimized", color: "#3B82F6" };
}

export default function ScoreGauge({ score, size = 260 }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const animRef = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const duration = 1800;

  useEffect(() => {
    startTime.current = null;
    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp;
      const elapsed = timestamp - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [score]);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size / 2) * 0.72;
  // Half-circle arc: from 180° to 0° (left to right)
  const startAngle = 180;
  const endAngle = 0;
  const totalArc = 180; // degrees
  const circumference = Math.PI * r; // half circle arc length

  const filledArc = (animatedScore / 100) * circumference;
  const strokeDasharray = `${filledArc} ${circumference}`;

  // Arc path: half circle from left to right, bottom-up
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const sx = cx + r * Math.cos(toRad(startAngle));
  const sy = cy + r * Math.sin(toRad(startAngle));
  const ex = cx + r * Math.cos(toRad(endAngle));
  const ey = cy + r * Math.sin(toRad(endAngle));

  const arcPath = `M ${sx} ${sy} A ${r} ${r} 0 0 1 ${ex} ${ey}`;

  const color = getScoreColor(animatedScore);
  const { tier, color: tierColor } = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.6 }}>
        <svg
          width={size}
          height={size * 0.6}
          viewBox={`0 0 ${size} ${size * 0.6 + 10}`}
          style={{ overflow: "visible" }}
        >
          {/* Background track */}
          <path
            d={arcPath}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={size * 0.065}
            strokeLinecap="round"
          />
          {/* Glow layer */}
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.065 + 8}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            opacity={0.18}
            style={{ filter: `blur(6px)` }}
          />
          {/* Filled arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.065}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            style={{ transition: "stroke-dasharray 0.05s linear" }}
          />
          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((val) => {
            const angle = 180 - (val / 100) * 180;
            const rad = toRad(angle);
            const innerR = r - size * 0.045;
            const outerR = r + size * 0.01;
            const x1 = cx + innerR * Math.cos(rad);
            const y1 = cy + innerR * Math.sin(rad);
            const x2 = cx + outerR * Math.cos(rad);
            const y2 = cy + outerR * Math.sin(rad);
            return (
              <line
                key={val}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
              />
            );
          })}
          {/* Score number */}
          <text
            x={cx}
            y={cy * 0.88}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={color}
            fontSize={size * 0.22}
            fontWeight="800"
            fontFamily="Sora, sans-serif"
            style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
          >
            {animatedScore}
          </text>
          <text
            x={cx}
            y={cy * 0.88 + size * 0.14}
            textAnchor="middle"
            fill="rgba(255,255,255,0.5)"
            fontSize={size * 0.07}
            fontFamily="Sora, sans-serif"
            fontWeight="500"
            letterSpacing="0.1em"
          >
            OUT OF 100
          </text>
          {/* Min/Max labels */}
          <text
            x={sx - 8}
            y={sy + 18}
            textAnchor="end"
            fill="rgba(255,255,255,0.35)"
            fontSize={size * 0.055}
            fontFamily="Inter, sans-serif"
          >
            0
          </text>
          <text
            x={ex + 8}
            y={ey + 18}
            textAnchor="start"
            fill="rgba(255,255,255,0.35)"
            fontSize={size * 0.055}
            fontFamily="Inter, sans-serif"
          >
            100
          </text>
        </svg>
      </div>
      {/* Tier badge */}
      <div
        className="mt-3 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase"
        style={{
          background: `${tierColor}20`,
          border: `1px solid ${tierColor}50`,
          color: tierColor,
          fontFamily: "Sora, sans-serif",
        }}
      >
        {tier}
      </div>
    </div>
  );
}
