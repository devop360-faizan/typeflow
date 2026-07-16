'use client';

import React from 'react';

interface KeyboardKey {
  code: string;
  label: string;
  specialWidth?: string;
  isSpace?: boolean;
}

const KEYBOARD_ROWS: KeyboardKey[][] = [
  [
    { code: 'Backquote', label: '`' },
    { code: 'Digit1', label: '1' },
    { code: 'Digit2', label: '2' },
    { code: 'Digit3', label: '3' },
    { code: 'Digit4', label: '4' },
    { code: 'Digit5', label: '5' },
    { code: 'Digit6', label: '6' },
    { code: 'Digit7', label: '7' },
    { code: 'Digit8', label: '8' },
    { code: 'Digit9', label: '9' },
    { code: 'Digit0', label: '0' },
    { code: 'Minus', label: '-' },
    { code: 'Equal', label: '=' },
    { code: 'Backspace', label: 'backspace', specialWidth: 'w-18 md:w-20' },
  ],
  [
    { code: 'Tab', label: 'tab', specialWidth: 'w-12 md:w-14' },
    { code: 'KeyQ', label: 'q' },
    { code: 'KeyW', label: 'w' },
    { code: 'KeyE', label: 'e' },
    { code: 'KeyR', label: 'r' },
    { code: 'KeyT', label: 't' },
    { code: 'KeyY', label: 'y' },
    { code: 'KeyU', label: 'u' },
    { code: 'KeyI', label: 'i' },
    { code: 'KeyO', label: 'o' },
    { code: 'KeyP', label: 'p' },
    { code: 'BracketLeft', label: '[' },
    { code: 'BracketRight', label: ']' },
    { code: 'Backslash', label: '\\', specialWidth: 'w-12 md:w-14' },
  ],
  [
    { code: 'CapsLock', label: 'caps', specialWidth: 'w-14 md:w-16' },
    { code: 'KeyA', label: 'a' },
    { code: 'KeyS', label: 's' },
    { code: 'KeyD', label: 'd' },
    { code: 'KeyF', label: 'f' },
    { code: 'KeyG', label: 'g' },
    { code: 'KeyH', label: 'h' },
    { code: 'KeyJ', label: 'j' },
    { code: 'KeyK', label: 'k' },
    { code: 'KeyL', label: 'l' },
    { code: 'Semicolon', label: ';' },
    { code: 'Quote', label: "'" },
    { code: 'Enter', label: 'enter', specialWidth: 'w-18 md:w-22' },
  ],
  [
    { code: 'ShiftLeft', label: 'shift', specialWidth: 'w-18 md:w-22' },
    { code: 'KeyZ', label: 'z' },
    { code: 'KeyX', label: 'x' },
    { code: 'KeyC', label: 'c' },
    { code: 'KeyV', label: 'v' },
    { code: 'KeyB', label: 'b' },
    { code: 'KeyN', label: 'n' },
    { code: 'KeyM', label: 'm' },
    { code: 'Comma', label: ',' },
    { code: 'Period', label: '.' },
    { code: 'Slash', label: '/' },
    { code: 'ShiftRight', label: 'shift', specialWidth: 'w-20 md:w-24' },
  ],
  [
    { code: 'ControlLeft', label: 'ctrl', specialWidth: 'w-11 md:w-14' },
    { code: 'MetaLeft', label: 'win', specialWidth: 'w-10 md:w-12' },
    { code: 'AltLeft', label: 'alt', specialWidth: 'w-10 md:w-12' },
    { code: 'Space', label: 'space', isSpace: true },
    { code: 'AltRight', label: 'alt', specialWidth: 'w-10 md:w-12' },
    { code: 'ControlRight', label: 'ctrl', specialWidth: 'w-11 md:w-14' },
  ]
];

interface KeyboardProps {
  activeKeys: Set<string>;
  heatmapData?: { [key: string]: number };
}

export default function Keyboard({ activeKeys, heatmapData }: KeyboardProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-5 bg-gradient-to-br from-theme-bg/60 via-theme-bg/40 to-theme-bg/50 border border-theme-sub/10 rounded-3xl flex flex-col gap-1.5 md:gap-2 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] backdrop-blur-sm select-none">
      {KEYBOARD_ROWS.map((row, rIdx) => (
        <div key={rIdx} className="flex justify-center gap-1 md:gap-1.5 w-full">
          {row.map((key) => {
            const isActive = activeKeys.has(key.code);
            const errorCount = heatmapData ? (heatmapData[key.code] || 0) : 0;
            
            // Width bindings
            let widthClass = 'w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[9px] sm:text-[10px] md:text-[11px]';
            if (key.specialWidth) {
              widthClass = `${key.specialWidth} h-7 sm:h-8 md:h-10 text-[9px] sm:text-[10px] md:text-[11px]`;
            } else if (key.isSpace) {
              widthClass = 'flex-1 max-w-[280px] sm:max-w-[380px] h-7 sm:h-8 md:h-10 text-[9px] sm:text-[10px] md:text-[11px]';
            }

            // Determine colors and layout values dynamically
            let colorClasses = '';
            if (isActive) {
              colorClasses = 'bg-theme-main border-theme-main text-theme-bg translate-y-[2px] shadow-none';
            } else if (heatmapData) {
              if (errorCount === 0) {
                colorClasses = 'bg-theme-bg/35 border border-theme-sub/10 text-theme-sub/30 shadow-none';
              } else if (errorCount === 1) {
                colorClasses = 'bg-red-500/10 border border-red-500/25 text-red-400/80 shadow-none';
              } else if (errorCount === 2) {
                colorClasses = 'bg-red-500/25 border border-red-500/40 text-red-300 shadow-none';
              } else {
                colorClasses = 'bg-red-600/50 border border-red-500/60 text-white shadow-none';
              }
            } else {
              colorClasses = 'bg-gradient-to-b from-theme-bg/95 to-theme-bg/75 border-t border-l border-r border-b-2 border-theme-sub/15 text-theme-sub/70 shadow-[0_2.5px_0_0_rgba(0,0,0,0.25)] hover:border-theme-sub/30';
            }

            return (
              <div
                key={key.code}
                className={`
                  flex items-center justify-center rounded-lg border font-mono font-bold tracking-wider uppercase transition-all duration-75
                  ${colorClasses}
                  ${widthClass}
                `}
                title={heatmapData && errorCount > 0 ? `${errorCount} errors` : undefined}
              >
                {key.label}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
