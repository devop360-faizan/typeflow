'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/Navbar';
import TypingArea from '../components/TypingArea';
import Keyboard from '../components/Keyboard';
import StatsView from '../components/StatsView';
import { getRandomWords } from '../utils/words';

interface PBTracker {
  [key: string]: number; // e.g. "time-30": 85, "words-50": 92
}

export default function Home() {
  // Config state (initialize with default values, load from localStorage in useEffect)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [mode, setMode] = useState<'time' | 'words'>('time');
  const [timeSetting, setTimeSetting] = useState(30);
  const [wordSetting, setWordSetting] = useState(25);
  const [soundType, setSoundType] = useState<'mechanical' | 'retro' | 'beep' | 'muted'>('mechanical');
  const [volume, setVolume] = useState(0.4);
  const [suddenDeath, setSuddenDeath] = useState(false);
  const [blindMode, setBlindMode] = useState(false);

  // Test flow state
  const [words, setWords] = useState<string[]>([]);
  const [status, setStatus] = useState<'idle' | 'typing' | 'completed'>('idle');
  const [isTypingActive, setIsTypingActive] = useState(false);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());

  // Real-time telemetry stats from typing area
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAcc, setLiveAcc] = useState(100);
  const [comboStreak, setComboStreak] = useState(0);

  // Personal Best tracker
  const [personalBests, setPersonalBests] = useState<PBTracker>({});
  const [isNewPb, setIsNewPb] = useState(false);

  // Completed stats data
  const [finalStats, setFinalStats] = useState<{
    wpmHistory: { second: number; wpm: number; rawWpm: number; errors: number }[];
    totalTime: number;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    keyMistakes: { [key: string]: number };
  } | null>(null);

  // Hydrate configurations from localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('tf-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') setTheme(savedTheme);

      const savedMode = localStorage.getItem('tf-mode') as any;
      if (savedMode) setMode(savedMode);

      const savedTime = localStorage.getItem('tf-time-setting');
      if (savedTime) setTimeSetting(parseInt(savedTime));

      const savedWords = localStorage.getItem('tf-word-setting');
      if (savedWords) setWordSetting(parseInt(savedWords));

      const savedSound = localStorage.getItem('tf-sound-type') as any;
      if (savedSound) setSoundType(savedSound);

      const savedVol = localStorage.getItem('tf-volume');
      if (savedVol) setVolume(parseFloat(savedVol));

      const savedDeath = localStorage.getItem('tf-sudden-death');
      if (savedDeath) setSuddenDeath(savedDeath === 'true');

      const savedBlind = localStorage.getItem('tf-blind-mode');
      if (savedBlind) setBlindMode(savedBlind === 'true');

      const savedPBs = localStorage.getItem('tf-pbs');
      if (savedPBs) {
        try {
          setPersonalBests(JSON.parse(savedPBs));
        } catch (_) {}
      }
    }
  }, []);

  // Save configurations and swap classnames on body
  useEffect(() => {
    localStorage.setItem('tf-theme', theme);
    const body = document.body;
    body.classList.remove('theme-dark', 'theme-light');
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tf-mode', mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem('tf-time-setting', timeSetting.toString());
  }, [timeSetting]);

  useEffect(() => {
    localStorage.setItem('tf-word-setting', wordSetting.toString());
  }, [wordSetting]);

  useEffect(() => {
    localStorage.setItem('tf-sound-type', soundType);
  }, [soundType]);

  useEffect(() => {
    localStorage.setItem('tf-volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('tf-sudden-death', suddenDeath.toString());
  }, [suddenDeath]);

  useEffect(() => {
    localStorage.setItem('tf-blind-mode', blindMode.toString());
  }, [blindMode]);

  // Initial words generation
  useEffect(() => {
    generateNewWords();
  }, [mode, timeSetting, wordSetting]);

  // Keyboard shortcut listener for restart
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (status === 'completed' && e.key === 'Enter') {
        e.preventDefault();
        restartTest();
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [status]);

  const generateNewWords = () => {
    const count = mode === 'words' ? wordSetting : 100;
    setWords(getRandomWords(count));
  };

  const restartTest = () => {
    generateNewWords();
    setStatus('idle');
    setIsTypingActive(false);
    setIsNewPb(false);
    setFinalStats(null);
    setActiveKeys(new Set());
    setLiveWpm(0);
    setLiveAcc(100);
    setComboStreak(0);
  };

  const handleTestComplete = (stats: typeof finalStats) => {
    if (!stats) return;
    setFinalStats(stats);
    setStatus('completed');
    setIsTypingActive(false);

    // Save Personal Best logic
    const pbKey = `${mode}-${mode === 'time' ? timeSetting : wordSetting}`;
    const currentPb = personalBests[pbKey] || 0;

    if (stats.wpm > currentPb) {
      const nextPBs = { ...personalBests, [pbKey]: stats.wpm };
      setPersonalBests(nextPBs);
      localStorage.setItem('tf-pbs', JSON.stringify(nextPBs));
      setIsNewPb(true);
    }
  };

  // Dynamic Rank & AI coach diagnostics selector based on typing metrics
  const telemetry = useMemo(() => {
    let rank = 'TRAINEE 🐢';
    let progressPercent = 0;
    
    if (liveWpm >= 95) {
      rank = 'OVERCLOCKED ⚡';
      progressPercent = 100;
    } else if (liveWpm >= 70) {
      rank = 'FALCON 🦅';
      progressPercent = ((liveWpm - 70) / (95 - 70)) * 100;
    } else if (liveWpm >= 45) {
      rank = 'CHEETAH 🐆';
      progressPercent = ((liveWpm - 45) / (70 - 45)) * 100;
    } else if (liveWpm >= 25) {
      rank = 'RABBIT 🐇';
      progressPercent = ((liveWpm - 25) / (45 - 25)) * 100;
    } else if (liveWpm > 0) {
      rank = 'TURTLE 🐢';
      progressPercent = (liveWpm / 25) * 100;
    }

    let coachMessage = 'System idle. Press any key inside practice console to initialize HUD telemetry analysis.';
    
    if (isTypingActive) {
      if (liveAcc < 90) {
        coachMessage = 'Warning: Accuracy has dropped below 90%. Focus on finger alignments and slow down to stabilize.';
      } else if (comboStreak >= 35) {
        coachMessage = 'Sensational! 35+ Combo Streak active. Muscle memory fully synchronized, WPM scaling high!';
      } else if (comboStreak >= 15) {
        coachMessage = 'Rhythm locked. You are moving with excellent key pacing. Maintain standard posture.';
      } else if (comboStreak >= 5) {
        coachMessage = 'Combo multipliers active. Keep correct letters flowing to elevate score ratings.';
      } else {
        coachMessage = 'Telemetry operational. Relax your wrists and maintain a steady tapping speed.';
      }
    } else if (status === 'completed') {
      coachMessage = 'Telemetry complete. Performance diagnostics computed below. Press Enter to retry.';
    }

    return { rank, progressPercent, coachMessage };
  }, [liveWpm, liveAcc, comboStreak, isTypingActive, status]);

  // SVG Gauge variables
  const maxWpmGauge = 110;
  const strokeDashoffset = useMemo(() => {
    const radius = 50;
    const circ = 2 * Math.PI * radius; // 314.15
    const percentage = Math.min(100, (liveWpm / maxWpmGauge) * 100);
    return circ - (circ * percentage) / 100;
  }, [liveWpm]);

  const activeSetting = mode === 'time' ? timeSetting : wordSetting;
  const currentPBValue = personalBests[`${mode}-${activeSetting}`] || 0;

  return (
    <div className="flex flex-col min-h-screen w-full relative overflow-x-hidden">
      
      {/* Premium Full-Screen Background Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-theme-main/5 rounded-full blur-[140px] transition-all duration-700" />
        <div className="absolute top-[35%] -left-[10%] w-[500px] h-[500px] bg-theme-main/3 rounded-full blur-[120px] transition-all duration-700" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[600px] h-[600px] bg-theme-main/4 rounded-full blur-[130px] transition-all duration-700" />
      </div>

      {/* Navigation Header */}
      <Navbar
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        setMode={setMode}
        timeSetting={timeSetting}
        setTimeSetting={setTimeSetting}
        wordSetting={wordSetting}
        setWordSetting={setWordSetting}
        soundType={soundType}
        setSoundType={setSoundType}
        volume={volume}
        setVolume={setVolume}
        isTypingActive={isTypingActive}
        suddenDeath={suddenDeath}
        setSuddenDeath={setSuddenDeath}
        blindMode={blindMode}
        setBlindMode={setBlindMode}
      />

      {/* Main interactive area */}
      <main className="flex-1 flex flex-col justify-center items-center py-6 relative z-10 w-full max-w-5xl mx-auto px-6">
        
        {/* PB Display when idle */}
        {status === 'idle' && currentPBValue > 0 && (
          <div className="text-xs font-mono text-theme-sub/40 mb-3 border border-theme-sub/10 rounded-full px-3 py-1 flex items-center gap-1.5 animate-fade bg-theme-bg/30">
            <svg className="w-3.5 h-3.5 text-theme-main" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Personal Best: <span className="text-theme-main font-bold">{currentPBValue} WPM</span>
          </div>
        )}

        {status !== 'completed' ? (
          /* Dynamic 4-Column Futuristic HUD Grid - Telemetry HUD moved to far right */
          <div className="w-full grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch animate-fade">
            
            {/* CORE TYPING CONSOLE (Takes 3/4 of the width) */}
            <div className="lg:col-span-3 flex flex-col gap-6 p-6 bg-theme-bg/30 border border-theme-sub/10 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-theme-main/5 rounded-full blur-2xl pointer-events-none" />
              
              {/* Practice Console Banner */}
              <div className="w-full flex justify-between items-center text-[10px] font-bold text-theme-sub/60 uppercase tracking-widest border-b border-theme-sub/10 pb-2 font-mono">
                <span>[ Practice Console ]</span>
                <span className="text-theme-main">{mode} mode</span>
              </div>

              {/* Typing Area */}
              <TypingArea
                words={words}
                mode={mode}
                timeSetting={timeSetting}
                wordSetting={wordSetting}
                suddenDeath={suddenDeath}
                blindMode={blindMode}
                onComboUpdate={setComboStreak}
                onRealtimeStatsUpdate={(wpm, acc) => {
                  setLiveWpm(wpm);
                  setLiveAcc(acc);
                }}
                onComplete={handleTestComplete}
                onRestartTrigger={restartTest}
                soundType={soundType}
                volume={volume}
                isTypingActive={isTypingActive}
                setIsTypingActive={setIsTypingActive}
                activeKeys={activeKeys}
                setActiveKeys={setActiveKeys}
              />
            </div>

            {/* RIGHT COLUMN: Live Performance Telemetry (Pushed further right) */}
            <div className={`lg:col-span-1 flex flex-col justify-between p-5 bg-theme-bg/25 border border-theme-sub/10 rounded-3xl backdrop-blur-md transition-all duration-300 shadow-xl ${
              isTypingActive ? 'scale-[0.98] border-theme-sub/5' : 'scale-100'
            }`}>

              <div className="space-y-4">
                <div className="text-[10px] font-bold text-theme-sub/60 uppercase tracking-widest border-b border-theme-sub/10 pb-1.5 font-mono">
                  [ Telemetry HUD ]
                </div>
                
                {/* Dynamic Speedometer Circle */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                      {/* Outer gray ring track */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="var(--sub-color)"
                        strokeWidth="5"
                        opacity="0.08"
                      />
                      {/* Active green/brand color speed arc */}
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="var(--main-color)"
                        strokeWidth="7"
                        strokeDasharray="314.15"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 60 60)"
                        className="transition-all duration-300"
                      />
                    </svg>
                    
                    {/* Centered speed statistics text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-mono select-none">
                      <span className="text-3xl font-extrabold text-theme-main leading-none mt-1">
                        {liveWpm}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-theme-sub/70 font-semibold">
                        wpm
                      </span>
                    </div>
                  </div>
                </div>

                {/* Real-time Accuracy display block */}
                <div className="space-y-1 font-mono">
                  <div className="flex justify-between text-[9px] uppercase text-theme-sub/60 font-bold">
                    <span>Accuracy:</span>
                    <span className="text-theme-text font-bold">{liveAcc}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-theme-sub/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        liveAcc >= 95 ? 'bg-theme-main' : liveAcc >= 90 ? 'bg-theme-main/60' : 'bg-theme-error'
                      }`}
                      style={{ width: `${liveAcc}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status warning bulbs for Sudden Death and Blind modes */}
              <div className="mt-4 pt-4 border-t border-theme-sub/10 flex flex-col gap-2 font-mono text-[9px]">
                {/* Sudden death light */}
                <div className="flex items-center justify-between">
                  <span className="text-theme-sub/60 uppercase">death override:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${suddenDeath ? 'bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]' : 'bg-theme-sub/20'}`} />
                    <span className={suddenDeath ? 'text-red-500 font-bold' : 'text-theme-sub/40'}>
                      {suddenDeath ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Blind Mode light */}
                <div className="flex items-center justify-between">
                  <span className="text-theme-sub/60 uppercase">blind override:</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${blindMode ? 'bg-theme-main animate-pulse shadow-[0_0_8px_var(--main-color)]' : 'bg-theme-sub/20'}`} />
                    <span className={blindMode ? 'text-theme-main font-bold' : 'text-theme-sub/40'}>
                      {blindMode ? 'ACTIVE' : 'OFF'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Finished summary stats page - also wrapped in glassmorphism dashboard */
          finalStats && (
            <div className="w-full bg-theme-bg/20 border border-theme-sub/10 rounded-[2.5rem] shadow-2xl backdrop-blur-md relative overflow-hidden transition-all duration-300">
              <StatsView
                stats={finalStats}
                mode={mode}
                setting={activeSetting}
                isPersonalBest={isNewPb}
                onRestart={restartTest}
              />
            </div>
          )
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-5xl mx-auto px-6 py-6 text-center text-xs text-theme-sub/30 border-t border-theme-sub/5 select-none font-mono">
        <div className="flex flex-col md:flex-row justify-between items-center gap-2">
          <div>
            TypeFlow Scientific HUD Console
          </div>
          <div className="flex gap-4">
            <span className="hover:text-theme-main transition-colors">v2.1.0</span>
            <span>&bull;</span>
            <span className="hover:text-theme-main transition-colors">Press Tab key to restart test</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
