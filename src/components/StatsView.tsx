'use client';

import React, { useState, useMemo } from 'react';
import Keyboard from './Keyboard';

interface StatsHistoryItem {
  second: number;
  wpm: number;
  rawWpm: number;
  errors: number;
}

interface StatsViewProps {
  stats: {
    wpmHistory: StatsHistoryItem[];
    totalTime: number;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    keyMistakes: { [key: string]: number };
  };
  mode: 'time' | 'words';
  setting: number;
  isPersonalBest: boolean;
  onRestart: () => void;
}

export default function StatsView({
  stats,
  mode,
  setting,
  isPersonalBest,
  onRestart,
}: StatsViewProps) {
  const {
    wpmHistory,
    totalTime,
    wpm,
    rawWpm,
    accuracy,
    correctChars,
    incorrectChars,
    extraChars,
    missedChars,
    keyMistakes,
  } = stats;

  // Tooltip tracking state
  const [hoveredPoint, setHoveredPoint] = useState<StatsHistoryItem | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // SVG dimensions
  const chartWidth = 850;
  const chartHeight = 220;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };

  // Calculate scales and coordinates using useMemo
  const chartData = useMemo(() => {
    if (wpmHistory.length === 0) return null;

    const maxWpm = Math.max(
      80, // Minimum height threshold
      ...wpmHistory.map((d) => Math.max(d.wpm, d.rawWpm))
    );
    const maxSec = wpmHistory.length;

    const getX = (sec: number) => {
      if (maxSec <= 1) return padding.left;
      return (
        padding.left +
        ((sec - 1) / (maxSec - 1)) * (chartWidth - padding.left - padding.right)
      );
    };

    const getY = (val: number) => {
      const heightRange = chartHeight - padding.top - padding.bottom;
      return chartHeight - padding.bottom - (val / maxWpm) * heightRange;
    };

    // Build SVG paths
    let wpmPath = '';
    let rawPath = '';
    let wpmAreaPath = '';

    wpmHistory.forEach((pt, i) => {
      const x = getX(pt.second);
      const yWpm = getY(pt.wpm);
      const yRaw = getY(pt.rawWpm);

      if (i === 0) {
        wpmPath = `M ${x} ${yWpm}`;
        rawPath = `M ${x} ${yRaw}`;
        wpmAreaPath = `M ${x} ${chartHeight - padding.bottom} L ${x} ${yWpm}`;
      } else {
        wpmPath += ` L ${x} ${yWpm}`;
        rawPath += ` L ${x} ${yRaw}`;
      }
    });

    if (wpmHistory.length > 0) {
      const lastX = getX(wpmHistory[wpmHistory.length - 1].second);
      wpmAreaPath += `${wpmPath.substring(1)} L ${lastX} ${chartHeight - padding.bottom} Z`;
    }

    // Gridlines positions
    const gridLines = [];
    const divisions = 4;
    for (let i = 1; i <= divisions; i++) {
      const val = Math.round((maxWpm / divisions) * i);
      gridLines.push({ val, y: getY(val) });
    }

    return { getX, getY, wpmPath, rawPath, wpmAreaPath, gridLines, maxWpm, maxSec };
  }, [wpmHistory]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!chartData || wpmHistory.length === 0) return;

    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;

    const scaleX = (clientX - padding.left) / (chartWidth - padding.left - padding.right);
    const fraction = scaleX * (wpmHistory.length - 1);
    const nearestIndex = Math.max(0, Math.min(wpmHistory.length - 1, Math.round(fraction)));

    setHoveredPoint(wpmHistory[nearestIndex]);
    setHoveredIndex(nearestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoveredIndex(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8 animate-fade select-none">
      
      {/* Primary stats rows */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
        {/* WPM Display */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-theme-sub uppercase font-mono">wpm</span>
          <div className="flex items-baseline gap-2">
            <span className="text-6xl md:text-7xl font-bold text-theme-main transition-all duration-300">
              {wpm}
            </span>
            {isPersonalBest && (
              <span className="text-xs bg-theme-main/10 border border-theme-main/30 text-theme-main px-1.5 py-0.5 rounded font-mono font-bold tracking-tight animate-bounce">
                NEW PB
              </span>
            )}
          </div>
        </div>

        {/* Accuracy Display */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-theme-sub uppercase font-mono">accuracy</span>
          <span className="text-6xl md:text-7xl font-bold text-theme-text transition-all duration-300">
            {accuracy}%
          </span>
        </div>

        {/* Raw WPM Display */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-theme-sub uppercase font-mono">raw wpm</span>
          <span className="text-4xl md:text-5xl font-bold text-theme-sub transition-all duration-300">
            {rawWpm}
          </span>
        </div>

        {/* Test Parameters display */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold tracking-wider text-theme-sub uppercase font-mono">test type</span>
          <span className="text-xl md:text-2xl font-bold text-theme-text uppercase font-mono">
            {mode} {setting}
          </span>
          <span className="text-xs text-theme-sub/60 mt-1 font-mono">
            duration: {totalTime}s
          </span>
        </div>
      </div>

      {/* Line Chart Section */}
      {chartData && (
        <div className="w-full bg-theme-bg/30 border border-theme-sub/10 rounded-2xl p-4 md:p-6 shadow-xl relative overflow-visible">
          <div className="text-xs font-semibold text-theme-sub/50 uppercase mb-3 tracking-widest flex justify-between items-center font-mono">
            <span>performance graph</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 normal-case">
                <span className="w-2.5 h-2.5 rounded-full bg-theme-main inline-block"></span>
                WPM
              </span>
              <span className="flex items-center gap-1.5 normal-case">
                <span className="w-2.5 h-1 border-t-2 border-dashed border-theme-sub inline-block"></span>
                Raw
              </span>
            </div>
          </div>

          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible cursor-crosshair"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--main-color)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--main-color)" stopOpacity="0.00" />
              </linearGradient>
            </defs>

            {/* Grid horizontal markers - slightly enhanced contrast for light mode */}
            {chartData.gridLines.map((line, idx) => (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={line.y}
                  x2={chartWidth - padding.right}
                  y2={line.y}
                  stroke="var(--sub-color)"
                  strokeOpacity="0.15"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={line.y + 4}
                  fill="var(--sub-color)"
                  fillOpacity="0.75"
                  className="text-[10px] font-mono text-right"
                  textAnchor="end"
                >
                  {line.val}
                </text>
              </g>
            ))}

            {/* X Axis label gridlines */}
            {wpmHistory.map((pt, i) => {
              const interval = Math.max(1, Math.round(wpmHistory.length / 8));
              if (pt.second % interval !== 0 && pt.second !== wpmHistory.length) return null;

              const x = chartData.getX(pt.second);
              return (
                <text
                  key={i}
                  x={x}
                  y={chartHeight - padding.bottom + 18}
                  fill="var(--sub-color)"
                  fillOpacity="0.75"
                  className="text-[10px] font-mono"
                  textAnchor="middle"
                >
                  {pt.second}s
                </text>
              );
            })}

            {/* Area under WPM */}
            <path d={chartData.wpmAreaPath} fill="url(#wpmGradient)" />

            {/* Raw WPM Line */}
            <path
              d={chartData.rawPath}
              fill="none"
              stroke="var(--sub-color)"
              strokeOpacity="0.55"
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />

            {/* WPM Line */}
            <path
              d={chartData.wpmPath}
              fill="none"
              stroke="var(--main-color)"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Error Dot Markers */}
            {wpmHistory.map((pt, i) => {
              if (pt.errors <= 0) return null;

              const x = chartData.getX(pt.second);
              const y = chartData.getY(pt.wpm);
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={3.5}
                  fill="var(--error-color)"
                  opacity="0.85"
                >
                  <title>{`${pt.errors} errors`}</title>
                </circle>
              );
            })}

            {/* Hover Guides */}
            {hoveredPoint && hoveredIndex !== null && (
              <g>
                <line
                  x1={chartData.getX(hoveredPoint.second)}
                  y1={padding.top}
                  x2={chartData.getX(hoveredPoint.second)}
                  y2={chartHeight - padding.bottom}
                  stroke="var(--main-color)"
                  strokeOpacity="0.25"
                  strokeWidth={1.5}
                />
                <circle
                  cx={chartData.getX(hoveredPoint.second)}
                  cy={chartData.getY(hoveredPoint.wpm)}
                  r={5}
                  fill="var(--main-color)"
                  stroke="var(--bg-color)"
                  strokeWidth={1.5}
                />
              </g>
            )}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredPoint && (
            <div
              className="absolute bg-theme-bg/95 border border-theme-main/30 text-theme-text rounded-lg p-2.5 shadow-2xl font-mono text-xs z-10 transition-all pointer-events-none"
              style={{
                left: `${Math.min(
                  chartWidth - 140,
                  Math.max(20, chartData.getX(hoveredPoint.second) - 60)
                )}px`,
                top: `${Math.max(10, chartData.getY(hoveredPoint.wpm) - 80)}px`,
              }}
            >
              <div className="font-bold text-theme-main mb-1">Time: {hoveredPoint.second}s</div>
              <div>WPM: {hoveredPoint.wpm}</div>
              <div>Raw: {hoveredPoint.rawWpm}</div>
              {hoveredPoint.errors > 0 && (
                <div className="text-theme-error">Errors: {hoveredPoint.errors}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Heatmap Panel Display */}
      {keyMistakes && Object.keys(keyMistakes).length > 0 && (
        <div className="w-full flex flex-col gap-3">
          <span className="text-xs font-semibold text-theme-sub/50 uppercase tracking-widest block font-mono pl-1">
            key error density map
          </span>
          <Keyboard activeKeys={new Set()} heatmapData={keyMistakes} />
        </div>
      )}

      {/* Detailed statistics tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-theme-bg/40 border border-theme-sub/10 rounded-2xl p-6">
        <div>
          <span className="text-xs font-semibold text-theme-sub uppercase tracking-wider block mb-2 font-mono">
            character breakdown
          </span>
          <div className="font-mono text-sm space-y-1.5 text-theme-text/80">
            <div className="flex justify-between">
              <span>Correct:</span>
              <span className="text-theme-main font-semibold">{correctChars}</span>
            </div>
            <div className="flex justify-between">
              <span>Incorrect:</span>
              <span className="text-theme-error font-semibold">{incorrectChars}</span>
            </div>
            <div className="flex justify-between">
              <span>Extra Letters:</span>
              <span className="text-theme-error-extra font-semibold">{extraChars}</span>
            </div>
            <div className="flex justify-between">
              <span>Missed Letters:</span>
              <span className="text-theme-sub/70">{missedChars}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-theme-sub uppercase tracking-wider block mb-2 font-mono">
            performance stats
          </span>
          <div className="font-mono text-sm space-y-1.5 text-theme-text/80">
            <div className="flex justify-between">
              <span>Test duration:</span>
              <span>{totalTime}s</span>
            </div>
            <div className="flex justify-between">
              <span>Total keys typed:</span>
              <span>{correctChars + incorrectChars + extraChars}</span>
            </div>
            <div className="flex justify-between">
              <span>Raw keystrokes:</span>
              <span>{correctChars + incorrectChars + extraChars + missedChars}</span>
            </div>
          </div>
        </div>

        {/* Action Button - updated as a capsule rounded button */}
        <div className="flex flex-col justify-center items-center md:items-end gap-3 pr-2 font-mono">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 bg-theme-main text-theme-bg font-extrabold uppercase tracking-widest text-[11px] py-3.5 px-8 rounded-full hover:scale-105 active:scale-95 transition-all shadow-md hover:shadow-theme-main/20 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
            </svg>
            Restart Practice
          </button>
          <span className="text-[10px] text-theme-sub/40">
            Press <span className="border border-theme-sub/20 px-1 py-0.5 rounded">Enter</span> to repeat
          </span>
        </div>
      </div>
    </div>
  );
}
