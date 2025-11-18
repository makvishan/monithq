'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { REGION_INFO } from '@/lib/constants';

export default function WorldMap({ results = [], onRegionHover }) {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Convert lat/lng to SVG coordinates (Mercator projection)
  const projectToSVG = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = (500 / 2) - (500 * mercN / (2 * Math.PI));
    return { x, y };
  };

  // Get region result data
  const getRegionData = (regionKey) => {
    return results?.find(r => r.region === regionKey);
  };

  // Get status color - using yellow for activity like Pingdom
  const getStatusColor = (result) => {
    if (!result || !result.success) return '#ef4444'; // red
    if (result.status === 'ONLINE') return '#eab308'; // yellow/gold
    if (result.status === 'DEGRADED') return '#f59e0b'; // orange
    return '#ef4444'; // red
  };

  // Handle region hover
  const handleRegionHover = (regionKey, event) => {
    setHoveredRegion(regionKey);
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      setTooltipPosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
    }
    if (onRegionHover) {
      onRegionHover(regionKey);
    }
  };

  // Format time
  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="relative w-full h-full min-h-[500px] bg-[#1a1a1a] rounded-lg overflow-hidden border border-gray-800">
      <svg
        viewBox="0 0 1000 500"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        style={{ background: '#1a1a1a' }}
      >
        <defs>
          <radialGradient id="markerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#eab308" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Simplified World Map - Recognizable continents */}
        <g className="continents" opacity="0.3" fill="#374151" stroke="#4b5563" strokeWidth="0.5">
          {/* North America */}
          <path d="M 120,140 L 125,135 L 130,130 L 135,125 L 140,122 L 145,120 L 155,118 L 165,117 L 175,115 L 185,115 L 195,116 L 205,118 L 215,122 L 222,127 L 228,133 L 232,140 L 235,148 L 237,157 L 238,167 L 238,177 L 237,187 L 235,197 L 232,206 L 228,214 L 223,221 L 217,227 L 210,232 L 202,236 L 193,239 L 183,241 L 173,242 L 163,242 L 153,241 L 143,239 L 134,236 L 126,232 L 119,227 L 113,221 L 108,214 L 104,206 L 101,197 L 99,187 L 98,177 L 98,167 L 99,157 L 101,148 L 104,140 L 108,133 L 113,127 Z" />

          {/* Greenland */}
          <path d="M 380,80 L 385,78 L 390,77 L 395,77 L 400,78 L 405,80 L 408,83 L 410,87 L 411,92 L 411,97 L 410,102 L 408,106 L 405,109 L 400,111 L 395,112 L 390,112 L 385,111 L 380,109 L 377,106 L 375,102 L 374,97 L 374,92 L 375,87 L 377,83 Z" />

          {/* South America */}
          <path d="M 225,245 L 228,242 L 232,240 L 237,239 L 242,239 L 247,240 L 251,242 L 254,245 L 256,249 L 257,254 L 257,310 L 256,350 L 254,375 L 251,390 L 247,400 L 242,407 L 237,411 L 232,413 L 227,414 L 222,414 L 217,413 L 212,411 L 208,407 L 205,402 L 203,396 L 202,390 L 201,340 L 202,290 L 204,270 L 207,258 L 211,250 L 216,246 Z" />

          {/* Europe */}
          <path d="M 470,130 L 478,128 L 486,127 L 494,127 L 502,128 L 509,130 L 515,133 L 520,137 L 524,142 L 527,148 L 529,155 L 530,162 L 530,170 L 529,178 L 527,185 L 524,191 L 520,196 L 515,200 L 509,203 L 502,205 L 494,206 L 486,206 L 478,205 L 471,203 L 465,200 L 460,196 L 456,191 L 453,185 L 451,178 L 450,170 L 450,162 L 451,155 L 453,148 L 456,142 L 460,137 L 465,133 Z" />

          {/* Africa */}
          <path d="M 485,210 L 492,209 L 499,209 L 505,210 L 511,212 L 516,215 L 520,219 L 523,224 L 525,230 L 526,237 L 526,290 L 525,330 L 523,360 L 520,380 L 516,395 L 511,405 L 505,412 L 499,416 L 492,418 L 485,419 L 478,419 L 471,418 L 465,416 L 460,412 L 456,405 L 453,395 L 451,380 L 450,360 L 449,330 L 450,290 L 451,250 L 453,237 L 456,230 L 460,224 L 465,219 L 471,215 L 478,212 Z" />

          {/* Asia */}
          <path d="M 530,115 L 545,112 L 560,110 L 580,109 L 600,109 L 620,110 L 640,112 L 658,115 L 675,119 L 690,124 L 703,130 L 714,137 L 723,145 L 730,154 L 735,164 L 738,175 L 740,187 L 740,200 L 738,213 L 735,225 L 730,236 L 723,246 L 714,254 L 703,261 L 690,267 L 675,272 L 658,276 L 640,279 L 620,281 L 600,282 L 580,282 L 560,281 L 545,279 L 532,276 L 528,260 L 527,240 L 528,220 L 530,200 L 532,180 L 533,160 L 532,140 L 530,125 Z" />

          {/* Australia */}
          <path d="M 720,330 L 728,329 L 736,329 L 744,330 L 751,332 L 757,335 L 762,339 L 766,344 L 769,350 L 771,357 L 772,365 L 772,373 L 771,381 L 769,388 L 766,394 L 762,399 L 757,403 L 751,406 L 744,408 L 736,409 L 728,409 L 720,408 L 713,406 L 707,403 L 702,399 L 698,394 L 695,388 L 693,381 L 692,373 L 692,365 L 693,357 L 695,350 L 698,344 L 702,339 L 707,335 L 713,332 Z" />

          {/* Japan */}
          <path d="M 780,180 L 783,179 L 786,179 L 789,180 L 791,182 L 792,185 L 792,200 L 791,215 L 789,218 L 786,219 L 783,219 L 780,218 L 778,215 L 777,200 L 778,185 L 778,182 Z" />

          {/* Antarctica (bottom strip) */}
          <path d="M 50,470 L 950,470 L 950,490 L 50,490 Z" opacity="0.2" />
        </g>

        {/* Region markers with glow effect */}
        {Object.entries(REGION_INFO).map(([key, info]) => {
          const coords = projectToSVG(info.coordinates.lat, info.coordinates.lng);
          const result = getRegionData(key);
          const isHovered = hoveredRegion === key;
          const hasResult = !!result;

          if (!hasResult) return null;

          return (
            <g key={key}>
              {/* Glow effect */}
              <motion.circle
                cx={coords.x}
                cy={coords.y}
                r="20"
                fill="url(#markerGlow)"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0, 0.4],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: Math.random() * 2,
                }}
              />

              {/* Outer ring pulse */}
              <motion.circle
                cx={coords.x}
                cy={coords.y}
                r="8"
                fill="none"
                stroke={getStatusColor(result)}
                strokeWidth="2"
                opacity="0.6"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{
                  scale: [1, 1.8, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: Math.random() * 2,
                }}
              />

              {/* Main dot */}
              <motion.circle
                cx={coords.x}
                cy={coords.y}
                r={isHovered ? "6" : "5"}
                fill={getStatusColor(result)}
                stroke="#fff"
                strokeWidth="1.5"
                className="cursor-pointer"
                style={{ filter: 'drop-shadow(0 0 4px rgba(234, 179, 8, 0.8))' }}
                onMouseEnter={(e) => handleRegionHover(key, e)}
                onMouseLeave={() => setHoveredRegion(null)}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.4,
                  delay: Math.random() * 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
                whileHover={{
                  scale: 1.4,
                  filter: 'drop-shadow(0 0 8px rgba(234, 179, 8, 1))',
                }}
              />
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredRegion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute z-50 pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -120%)',
            }}
          >
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 min-w-[220px]">
              {(() => {
                const info = REGION_INFO[hoveredRegion];
                const result = getRegionData(hoveredRegion);

                return (
                  <>
                    <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-700">
                      <span className="text-2xl">{info.flag}</span>
                      <div>
                        <div className="font-semibold text-sm text-white">
                          {info.name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {info.location}
                        </div>
                      </div>
                    </div>

                    {result ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Status:</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                            result.success && result.status === 'ONLINE'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : result.status === 'DEGRADED'
                              ? 'bg-orange-500/20 text-orange-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {result.success ? result.status : 'OFFLINE'}
                          </span>
                        </div>

                        {result.responseTime && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Response:</span>
                            <span className="text-xs font-semibold text-white">
                              {formatTime(result.responseTime)}
                            </span>
                          </div>
                        )}

                        {result.statusCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Status Code:</span>
                            <span className="text-xs font-mono font-semibold text-white">
                              {result.statusCode}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-2">
                        No data available
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend - Pingdom style */}
      <div className="absolute bottom-4 right-4 bg-gray-900/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-gray-700">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" style={{ boxShadow: '0 0 4px rgba(234, 179, 8, 0.8)' }}></div>
            <span>Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" style={{ boxShadow: '0 0 4px rgba(239, 68, 68, 0.8)' }}></div>
            <span>Issue</span>
          </div>
        </div>
      </div>
    </div>
  );
}
