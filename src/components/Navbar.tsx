'use client';

import React from 'react';

export const SOUND_TYPES = [
  { id: 'mechanical', name: 'mechanical' },
  { id: 'retro', name: 'typewriter' },
  { id: 'beep', name: 'beep' },
  { id: 'muted', name: 'muted' },
] as const;

interface NavbarProps {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  mode: 'time' | 'words';
  setMode: (mode: 'time' | 'words') => void;
  timeSetting: number;
  setTimeSetting: (time: number) => void;
  wordSetting: number;
  setWordSetting: (words: number) => void;
  soundType: 'mechanical' | 'retro' | 'beep' | 'muted';
  setSoundType: (type: 'mechanical' | 'retro' | 'beep' | 'muted') => void;
  volume: number;
  setVolume: (vol: number) => void;
  isTypingActive: boolean;
  suddenDeath: boolean;
  setSuddenDeath: (val: boolean) => void;
  blindMode: boolean;
  setBlindMode: (val: boolean) => void;
}

export default function Navbar({
  theme,
  setTheme,
  mode,
  setMode,
  timeSetting,
  setTimeSetting,
  wordSetting,
  setWordSetting,
  soundType,
  setSoundType,
  volume,
  setVolume,
  isTypingActive,
  suddenDeath,
  setSuddenDeath,
  blindMode,
  setBlindMode,
}: NavbarProps) {
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="w-full max-w-5xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 transition-opacity duration-300 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 cursor-pointer group">
          <svg
            className="w-8 h-8 text-theme-main transition-transform group-hover:scale-110 duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xl font-bold tracking-widest text-theme-text group-hover:text-theme-main transition-colors duration-200 uppercase font-mono">
            type<span className="text-theme-main">flow</span> <span className="text-[10px] bg-theme-main/15 text-theme-main px-1.5 py-0.5 rounded ml-1 font-bold">HUD</span>
          </span>
        </div>
      </div>

      {/* Mode settings toolbar - redesigned as custom segmented pill containers */}
      <div
        className={`flex flex-wrap items-center justify-center gap-4 bg-theme-bg/60 border border-theme-sub/20 py-2.5 px-4 rounded-3xl transition-all duration-300 ${
          isTypingActive ? 'opacity-0 pointer-events-none scale-95 blur-sm' : 'opacity-100 scale-100'
        }`}
      >
        {/* Core Mode Segmented Capsule */}
        <div className="flex p-0.5 bg-theme-bg/60 border border-theme-sub/10 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
          <button
            onClick={() => setMode('time')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
              mode === 'time'
                ? 'bg-theme-main text-theme-bg font-extrabold shadow-sm scale-105'
                : 'text-theme-sub hover:text-theme-text'
            }`}
          >
            time
          </button>
          <button
            onClick={() => setMode('words')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all ${
              mode === 'words'
                ? 'bg-theme-main text-theme-bg font-extrabold shadow-sm scale-105'
                : 'text-theme-sub hover:text-theme-text'
            }`}
          >
            words
          </button>
        </div>

        {/* Dynamic Length Segmented Capsule */}
        <div className="flex p-0.5 bg-theme-bg/60 border border-theme-sub/10 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] font-mono">
          {mode === 'time' ? (
            <>
              {[15, 30, 60, 120].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeSetting(t)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    timeSetting === t
                      ? 'bg-theme-main text-theme-bg font-extrabold shadow-sm scale-105'
                      : 'text-theme-sub hover:text-theme-text'
                  }`}
                >
                  {t}s
                </button>
              ))}
            </>
          ) : (
            <>
              {[10, 25, 50, 100].map((w) => (
                <button
                  key={w}
                  onClick={() => setWordSetting(w)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    wordSetting === w
                      ? 'bg-theme-main text-theme-bg font-extrabold shadow-sm scale-105'
                      : 'text-theme-sub hover:text-theme-text'
                  }`}
                >
                  {w}
                </button>
              ))}
            </>
          )}
        </div>

        {/* Game Mode Warning Capsules */}
        <div className="flex items-center gap-2">
          {/* Sudden Death capsule toggle */}
          <button
            onClick={() => setSuddenDeath(!suddenDeath)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              suddenDeath
                ? 'bg-red-500/15 border-red-500/40 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)] font-extrabold'
                : 'border-theme-sub/15 bg-theme-bg/40 text-theme-sub hover:border-theme-sub/30 hover:text-theme-text'
            }`}
            title="Sudden Death: 1 typo terminates the test!"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${suddenDeath ? 'bg-red-500 animate-ping' : 'bg-theme-sub/30'}`} />
            death
          </button>

          {/* Blind Mode capsule toggle */}
          <button
            onClick={() => setBlindMode(!blindMode)}
            className={`px-3 py-1.5 rounded-full text-[9px] font-bold tracking-wider uppercase border transition-all duration-200 flex items-center gap-1 cursor-pointer ${
              blindMode
                ? 'bg-theme-main/15 border-theme-main/40 text-theme-main shadow-[0_0_12px_rgba(59,130,246,0.2)] font-extrabold'
                : 'border-theme-sub/15 bg-theme-bg/40 text-theme-sub hover:border-theme-sub/30 hover:text-theme-text'
            }`}
            title="Blind Mode: Typed words become invisible!"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${blindMode ? 'bg-theme-main animate-ping' : 'bg-theme-sub/30'}`} />
            blind
          </button>
        </div>

        {/* Sound Selection Segmented Capsule */}
        <div className="flex items-center gap-2">
          <div className="flex p-0.5 bg-theme-bg/60 border border-theme-sub/10 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as any)}
              className="bg-transparent text-[9px] font-bold text-theme-sub hover:text-theme-text font-mono border-none outline-none cursor-pointer focus:ring-0 uppercase tracking-widest pl-2.5 pr-1 py-1"
            >
              {SOUND_TYPES.map((st) => (
                <option key={st.id} value={st.id} className="bg-theme-bg text-theme-text uppercase font-mono text-[9px]">
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {soundType !== 'muted' && (
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-12 h-1 bg-theme-sub/20 accent-theme-main rounded-lg appearance-none cursor-pointer"
              title="Volume"
            />
          )}
        </div>
      </div>

      {/* Sun/Moon Toggle Switch - Clean vector icon representing Light/Dark Mode */}
      <div
        className={`transition-all duration-300 ${
          isTypingActive ? 'opacity-0 pointer-events-none scale-95 blur-sm' : 'opacity-100 scale-100'
        }`}
      >
        <button
          onClick={toggleTheme}
          className="group p-2.5 rounded-full border border-theme-sub/20 bg-theme-bg/40 text-theme-sub hover:text-theme-main hover:border-theme-main hover:shadow-[0_0_12px_rgba(59,130,246,0.15)] transition-all duration-300 scale-100 hover:scale-110 active:scale-95 shadow-md cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? (
            /* Sun Icon (representing Light Mode option) */
            <svg className="w-5 h-5 transition-transform duration-500 rotate-0 group-hover:rotate-90" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            /* Moon Icon (representing Dark Mode option) */
            <svg className="w-5 h-5 transition-transform duration-500 rotate-0 group-hover:-rotate-12" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
