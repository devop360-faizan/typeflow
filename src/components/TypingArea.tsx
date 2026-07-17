'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { audioEngine } from './AudioEngine';

interface TypingAreaProps {
  words: string[];
  mode: 'time' | 'words';
  timeSetting: number;
  wordSetting: number;
  suddenDeath: boolean;
  blindMode: boolean;
  onComboUpdate: (combo: number) => void;
  onRealtimeStatsUpdate?: (wpm: number, accuracy: number) => void; // Added for live speedometer HUD
  onComplete: (stats: {
    wpmHistory: { second: number; wpm: number; rawWpm: number; errors: number }[];
    totalTime: number;
    rawWpm: number;
    wpm: number;
    accuracy: number;
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    missedChars: number;
    keyMistakes: { [key: string]: number };
  }) => void;
  onRestartTrigger: () => void;
  soundType: 'mechanical' | 'retro' | 'beep' | 'muted';
  volume: number;
  isTypingActive: boolean;
  setIsTypingActive: (active: boolean) => void;
  activeKeys: Set<string>;
  setActiveKeys: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export default function TypingArea({
  words: initialWords,
  mode,
  timeSetting,
  wordSetting,
  suddenDeath,
  blindMode,
  onComboUpdate,
  onRealtimeStatsUpdate,
  onComplete,
  onRestartTrigger,
  soundType,
  volume,
  isTypingActive,
  setIsTypingActive,
  activeKeys,
  setActiveKeys,
}: TypingAreaProps) {

  const [words, setWords] = useState<string[]>(initialWords);
  
  // React state for rendering
  const [typedWords, _setTypedWords] = useState<string[]>(['']);
  const [wordIndex, _setWordIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);

  // Synchronous refs to prevent race condition skips
  const typedWordsRef = useRef<string[]>(['']);
  const wordIndexRef = useRef(0);
  const keyMistakesRef = useRef<{ [key: string]: number }>({});
  const comboRef = useRef(0);

  const setTypedWords = (val: string[] | ((prev: string[]) => string[])) => {
    const next = typeof val === 'function' ? val(typedWordsRef.current) : val;
    typedWordsRef.current = next;
    _setTypedWords(next);
  };

  const setWordIndex = (val: number | ((prev: number) => number)) => {
    const next = typeof val === 'function' ? val(wordIndexRef.current) : val;
    wordIndexRef.current = next;
    _setWordIndex(next);
  };

  // Focus and input refs
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wordSpansRef = useRef<(HTMLDivElement | null)[]>([]);

  // Caret coordinate state
  const [caretPos, setCaretPos] = useState({ left: 0, top: 0, height: 0 });
  const [isCaretBlinking, setIsCaretBlinking] = useState(true);

  // Container scroll translate offset
  const [translateY, setTranslateY] = useState(0);

  // Typing statistics state
  const [startTime, setStartTime] = useState<number | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeSetting);
  
  // Keystrokes counting
  const [rawKeystrokes, setRawKeystrokes] = useState(0);
  const [correctKeystrokes, setCorrectKeystrokes] = useState(0);
  const [wpmHistory, setWpmHistory] = useState<{ second: number; wpm: number; rawWpm: number; errors: number }[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync sound engine parameters
  useEffect(() => {
    audioEngine.setSoundType(soundType);
    audioEngine.setVolume(volume);
  }, [soundType, volume]);

  // Reset local state when initial words or configuration changes
  useEffect(() => {
    setWords(initialWords);
    
    // Reset refs synchronously
    typedWordsRef.current = [''];
    wordIndexRef.current = 0;
    keyMistakesRef.current = {};
    comboRef.current = 0;
    onComboUpdate(0);

    _setTypedWords(['']);
    _setWordIndex(0);
    setCharIndex(0);

    setIsTypingActive(false);
    setStartTime(null);
    setSecondsElapsed(0);
    setTimeLeft(mode === 'time' ? timeSetting : 0);
    setRawKeystrokes(0);
    setCorrectKeystrokes(0);
    setWpmHistory([]);
    setTranslateY(0);
    setIsCaretBlinking(true);
    if (timerRef.current) clearInterval(timerRef.current);

    // Reposition caret to origin
    setTimeout(updateCaretPosition, 50);
  }, [initialWords, mode, timeSetting, wordSetting, suddenDeath, blindMode]);

  // Refocus input automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Set timer logic
  useEffect(() => {
    if (isTypingActive && startTime !== null) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        setSecondsElapsed(elapsed);

        if (mode === 'time') {
          const newTimeLeft = Math.max(0, timeSetting - elapsed);
          setTimeLeft(newTimeLeft);

          // Compute snapshots for graph
          recordHistorySnapshot(elapsed);

          if (newTimeLeft === 0) {
            handleTestComplete(elapsed);
          }
        } else {
          setTimeLeft(elapsed);
          recordHistorySnapshot(elapsed);
        }
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTypingActive, startTime, mode, timeSetting]);

  // Sync window focus listener
  useEffect(() => {
    const handleWindowFocus = () => {
      if (isFocused && inputRef.current) inputRef.current.focus();
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isFocused]);

  // Update caret when word/character index or typed content changes
  useEffect(() => {
    updateCaretPosition();
  }, [wordIndex, charIndex, typedWords, words]);

  // Record a stats snapshot for the chart every second
  const recordHistorySnapshot = (elapsed: number) => {
    if (elapsed <= 0) return;
    
    // Total typed characters so far
    let totalChars = 0;
    let correctChars = 0;
    
    const activeWordIdx = wordIndexRef.current;
    const currentTypedWords = typedWordsRef.current;

    currentTypedWords.forEach((typed, idx) => {
      const original = words[idx] || '';
      for (let i = 0; i < typed.length; i++) {
        totalChars++;
        if (typed[i] === original[i]) {
          correctChars++;
        }
      }
      if (idx < activeWordIdx) {
        totalChars++;
        correctChars++;
      }
    });

    const elapsedMins = elapsed / 60;
    const currentWpm = Math.round((correctChars / 5) / elapsedMins);
    const currentRawWpm = Math.round((rawKeystrokes / 5) / elapsedMins);
    const recentErrors = Math.max(0, rawKeystrokes - correctKeystrokes);

    setWpmHistory(prev => [
      ...prev,
      { second: elapsed, wpm: currentWpm, rawWpm: currentRawWpm, errors: recentErrors }
    ]);
  };

  // Finalize statistics on completion
  const handleTestComplete = (finalTime: number) => {
    setIsTypingActive(false);
    if (timerRef.current) clearInterval(timerRef.current);

    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;
    let missedChars = 0;

    const activeWordIdx = wordIndexRef.current;
    const currentTypedWords = typedWordsRef.current;

    words.forEach((word, wIdx) => {
      const typed = currentTypedWords[wIdx] || '';
      
      if (wIdx > activeWordIdx) {
        missedChars += word.length;
        return;
      }

      for (let cIdx = 0; cIdx < Math.max(word.length, typed.length); cIdx++) {
        if (cIdx >= word.length) {
          extraChars++;
        } else if (cIdx >= typed.length) {
          if (wIdx < activeWordIdx) {
            missedChars++;
          }
        } else if (typed[cIdx] === word[cIdx]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
      }

      if (wIdx < activeWordIdx) {
        correctChars++;
      }
    });

    const duration = finalTime || 1;
    const minutes = duration / 60;
    
    const finalWpm = Math.max(0, Math.round((correctChars / 5) / minutes));
    const finalRawWpm = Math.max(0, Math.round((rawKeystrokes / 5) / minutes));
    const finalAccuracy = rawKeystrokes > 0 ? Math.round((correctKeystrokes / rawKeystrokes) * 100) : 100;
    const finalHistory = wpmHistory.length > 0 ? wpmHistory : [{ second: 1, wpm: finalWpm, rawWpm: finalRawWpm, errors: incorrectChars }];

    onComplete({
      wpmHistory: finalHistory,
      totalTime: duration,
      wpm: finalWpm,
      rawWpm: finalRawWpm,
      accuracy: finalAccuracy,
      correctChars,
      incorrectChars,
      extraChars,
      missedChars,
      keyMistakes: keyMistakesRef.current
    });
  };

  // Align caret element with the target DOM character span
  const updateCaretPosition = () => {
    try {
      const activeWordSpan = wordSpansRef.current[wordIndex];
      if (!activeWordSpan) return;

      const activeWordRect = activeWordSpan.getBoundingClientRect();
      const parentRect = containerRef.current?.getBoundingClientRect();
      if (!parentRect) return;

      const relativeWordLeft = activeWordRect.left - parentRect.left;
      const relativeWordTop = activeWordRect.top - parentRect.top;

      // Find character span inside active word
      const charSpans = activeWordSpan.querySelectorAll('.letter-node');
      
      if (charSpans.length === 0 || charIndex === 0) {
        // Place caret at start of word
        setCaretPos({
          left: relativeWordLeft,
          top: relativeWordTop + 6,
          height: activeWordRect.height - 12
        });
      } else if (charIndex <= charSpans.length) {
        // Place caret after previous character
        const prevCharSpan = charSpans[charIndex - 1] as HTMLElement;
        setCaretPos({
          left: relativeWordLeft + prevCharSpan.offsetLeft + prevCharSpan.offsetWidth,
          top: relativeWordTop + prevCharSpan.offsetTop + 6,
          height: prevCharSpan.offsetHeight - 12
        });
      } else {
        // Handle extra characters past word boundary
        const extraSpans = activeWordSpan.querySelectorAll('.extra-letter');
        if (extraSpans.length > 0) {
          const lastExtra = extraSpans[extraSpans.length - 1] as HTMLElement;
          setCaretPos({
            left: relativeWordLeft + lastExtra.offsetLeft + lastExtra.offsetWidth,
            top: relativeWordTop + lastExtra.offsetTop + 6,
            height: lastExtra.offsetHeight - 12
          });
        }
      }

      // Handle row scrolling
      if (relativeWordTop > 35) {
        setTranslateY(-relativeWordTop + 6);
      } else if (relativeWordTop === 0) {
        setTranslateY(0);
      }
    } catch (e) {
      console.warn("Caret reposition warning:", e);
    }
  };

  const handleInputFocus = () => setIsFocused(true);
  const handleInputBlur = () => setIsFocused(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key;
    const code = e.code;

    setActiveKeys(prev => {
      const next = new Set(prev);
      next.add(code);
      return next;
    });

    setIsCaretBlinking(false);

    if (key === 'Escape' || (key === 'Tab' && !e.shiftKey)) {
      e.preventDefault();
      onRestartTrigger();
      return;
    }

    if (!isTypingActive && key.length === 1 && key !== ' ') {
      setIsTypingActive(true);
      setStartTime(Date.now());
    }

    const currentWordIndex = wordIndexRef.current;
    const currentTypedWords = typedWordsRef.current;
    const currentTypedWord = currentTypedWords[currentWordIndex] || '';
    const currentCharIndex = currentTypedWord.length;
    const currentOriginalWord = words[currentWordIndex] || '';

    // Handle Backspace
    if (key === 'Backspace') {
      e.preventDefault();
      
      if (currentCharIndex === 0 && currentWordIndex > 0) {
        const prevWordIdx = currentWordIndex - 1;
        const prevTyped = currentTypedWords[prevWordIdx];
        const prevOriginal = words[prevWordIdx];

        if (prevTyped !== prevOriginal) {
          setWordIndex(prevWordIdx);
          setCharIndex(prevTyped.length);
          
          const nextTyped = [...currentTypedWords];
          nextTyped.pop();
          setTypedWords(nextTyped);
          audioEngine.playKey(false);
        }
      } else if (currentCharIndex > 0) {
        const nextTypedWord = currentTypedWord.slice(0, -1);
        const nextTyped = [...currentTypedWords];
        nextTyped[currentWordIndex] = nextTypedWord;
        setTypedWords(nextTyped);
        setCharIndex(currentCharIndex - 1);
        audioEngine.playKey(false);
      }
      return;
    }

    // Handle Space (Word submission)
    if (key === ' ') {
      e.preventDefault();
      
      if (currentTypedWord.length > 0) {
        audioEngine.playKey(true);
        setRawKeystrokes(prev => prev + 1);

        if (currentTypedWord === currentOriginalWord) {
          setCorrectKeystrokes(prev => prev + 1);
          // Update combo streak on correct word
          comboRef.current += 1;
          onComboUpdate(comboRef.current);
        } else {
          // Typos break streaks
          comboRef.current = 0;
          onComboUpdate(0);
          
          // Log space errors into mistakes map
          keyMistakesRef.current = {
            ...keyMistakesRef.current,
            'Space': (keyMistakesRef.current['Space'] || 0) + 1
          };

          // Sudden death checking
          if (suddenDeath) {
            handleTestComplete(secondsElapsed);
            return;
          }
        }

        if (mode === 'words' && currentWordIndex === wordSetting - 1) {
          handleTestComplete(secondsElapsed);
          return;
        }

        if (mode === 'time' && currentWordIndex >= words.length - 8) {
          import('../utils/words').then(({ getRandomWords }) => {
            setWords(prev => [...prev, ...getRandomWords(20)]);
          });
        }

        const nextWordIdx = currentWordIndex + 1;
        setWordIndex(nextWordIdx);
        setCharIndex(0);
        setTypedWords([...currentTypedWords, '']);
      }
      return;
    }

    // Handle character typing
    if (key.length === 1) {
      e.preventDefault();
      
      if (currentCharIndex >= currentOriginalWord.length + 10) return;

      const nextTypedWord = currentTypedWord + key;
      const nextTyped = [...currentTypedWords];
      nextTyped[currentWordIndex] = nextTypedWord;
      setTypedWords(nextTyped);
      setCharIndex(currentCharIndex + 1);
      
      setRawKeystrokes(prev => prev + 1);
      
      const isCorrect = currentCharIndex < currentOriginalWord.length && key === currentOriginalWord[currentCharIndex];
      if (isCorrect) {
        setCorrectKeystrokes(prev => prev + 1);
        audioEngine.playKey(false);
      } else {
        audioEngine.playError();
        
        // Typo resets combo streak
        comboRef.current = 0;
        onComboUpdate(0);

        // Track key error mapping
        keyMistakesRef.current = {
          ...keyMistakesRef.current,
          [code]: (keyMistakesRef.current[code] || 0) + 1
        };

        // Sudden death checking
        if (suddenDeath) {
          handleTestComplete(secondsElapsed);
          return;
        }
      }

      if (
        mode === 'words' &&
        currentWordIndex === wordSetting - 1 &&
        nextTypedWord.length >= currentOriginalWord.length
      ) {
        if (nextTypedWord === currentOriginalWord) {
          handleTestComplete(secondsElapsed);
        }
      }
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const code = e.code;
    setActiveKeys(prev => {
      const next = new Set(prev);
      next.delete(code);
      return next;
    });
    
    setIsCaretBlinking(true);
  };

  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const currentWpmDisplay = useMemo(() => {
    if (secondsElapsed <= 0) return 0;
    const activeWordIdx = wordIndex;
    let cor = 0;
    typedWords.forEach((typed, idx) => {
      const orig = words[idx] || '';
      for (let i = 0; i < typed.length; i++) {
        if (typed[i] === orig[i]) cor++;
      }
      if (idx < activeWordIdx) cor++; // Space counts
    });
    return Math.round((cor / 5) / (secondsElapsed / 60));
  }, [typedWords, wordIndex, words, secondsElapsed]);

  const currentAccDisplay = useMemo(() => {
    if (rawKeystrokes <= 0) return 100;
    return Math.round((correctKeystrokes / rawKeystrokes) * 100);
  }, [correctKeystrokes, rawKeystrokes]);

  useEffect(() => {
    if (onRealtimeStatsUpdate) {
      onRealtimeStatsUpdate(currentWpmDisplay, currentAccDisplay);
    }
  }, [currentWpmDisplay, currentAccDisplay, onRealtimeStatsUpdate]);


  return (
    <div className="w-full max-w-none px-2 py-4 relative select-none">
      
      {/* Realtime stats feedback top bar */}
      <div className="flex justify-between items-center mb-6 h-8 text-theme-main text-xl font-bold">
        <div>
          {mode === 'time' ? (
            <span className="font-mono text-2xl tracking-wider">{timeLeft}s</span>
          ) : (
            <span className="font-mono text-2xl tracking-wider">
              {wordIndex}/{wordSetting}
            </span>
          )}
        </div>
        {isTypingActive && startTime && (
          <div className="flex items-center gap-6 text-sm font-mono opacity-80 animate-pulse">
            <div>WPM: {currentWpmDisplay}</div>
            <div>ACC: {currentAccDisplay}%</div>
          </div>
        )}
      </div>

      {/* Hidden input catching keystrokes */}
      <input
        ref={inputRef}
        type="text"
        value={typedWords[wordIndex] || ''}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className="absolute w-0 h-0 opacity-0 pointer-events-none"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />

      {/* Main typing container wrapper */}
      <div
        onClick={focusInput}
        className={`relative w-full h-[180px] md:h-[220px] overflow-hidden cursor-text transition-all duration-200 ${
          isFocused ? 'ring-0' : 'opacity-85'
        }`}
      >
        {!isFocused && (
          <div className="absolute inset-0 flex items-center justify-center bg-theme-bg/65 z-10 backdrop-blur-[2px] transition-all rounded-2xl border border-theme-sub/10">
            <span className="flex items-center gap-2 text-theme-main text-base md:text-lg animate-pulse font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
              Click here or press any key to focus
            </span>
          </div>
        )}

        {/* Caret Element - moves smoothly with gorgeous glow */}
        <div
          className={`absolute w-[3px] bg-theme-caret rounded-full shadow-[0_0_8px_var(--caret-color),0_0_3px_var(--caret-color)] transition-transform duration-75 pointer-events-none z-5 ${
            isCaretBlinking ? 'animate-caret-blink' : ''
          }`}
          style={{
            transform: `translate3d(${caretPos.left}px, ${caretPos.top + translateY}px, 0)`,
            height: `${caretPos.height}px`,
          }}
        />

        {/* Words Grid Container */}
        <div
          ref={containerRef}
          className="flex flex-wrap text-3xl md:text-4xl lg:text-[2.5rem] leading-relaxed text-theme-sub font-mono select-none tracking-wide transition-transform duration-200"
          style={{
            transform: `translate3d(0, ${translateY}px, 0)`,
          }}
        >
          {words.slice(0, mode === 'words' ? wordSetting : words.length).map((word, wIdx) => {
            const typed = typedWords[wIdx] || '';
            const isActive = wIdx === wordIndex;
            const isCompleted = wIdx < wordIndex;

            // Compute classes for spelling errors in completed words
            let wordBorderClass = '';
            if (isCompleted && typed !== word) {
              wordBorderClass = 'border-b-2 border-theme-error/40';
            }

            return (
              <div
                key={wIdx}
                ref={(el) => {
                  wordSpansRef.current[wIdx] = el;
                }}
                className={`flex flex-wrap mr-4 mb-2.5 scroll-mt-2 rounded transition-all duration-100 relative ${
                  isActive ? 'text-theme-text/40' : ''
                } ${wordBorderClass}`}
              >
                {/* Standard letters */}
                {word.split('').map((char, cIdx) => {
                  let letterColorClass = 'text-theme-sub'; // Untyped
                  
                  if (wIdx < wordIndex) {
                    // Completed word letters: in Blind Mode they fade to invisible
                    if (blindMode) {
                      letterColorClass = 'opacity-0 scale-90 duration-300';
                    } else {
                      letterColorClass = typed[cIdx] === char ? 'text-theme-text' : 'text-theme-error';
                    }
                  } else if (isActive) {
                    // Active word letters: typed letters fade in Blind Mode
                    if (cIdx < typed.length) {
                      if (blindMode) {
                        letterColorClass = 'opacity-0 scale-90 duration-300';
                      } else {
                        letterColorClass = typed[cIdx] === char ? 'text-theme-text' : 'text-theme-error';
                      }
                    }
                  }

                  return (
                    <span
                      key={cIdx}
                      className={`letter-node letter-transition ${letterColorClass}`}
                    >
                      {char}
                    </span>
                  );
                })}

                {/* Extra letters if typed too far */}
                {isActive &&
                  typed.length > word.length &&
                  typed.slice(word.length).split('').map((char, extraIdx) => (
                    <span
                      key={extraIdx}
                      className="extra-letter text-theme-error-extra opacity-90 line-through"
                    >
                      {char}
                    </span>
                  ))}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Restart Keyboard Tip Indicator */}
      <div className="w-full text-center mt-6 text-xs text-theme-sub/30 animate-fade">
        <span className="border border-theme-sub/20 py-0.5 px-1.5 rounded">Tab</span> + <span className="border border-theme-sub/20 py-0.5 px-1.5 rounded">Enter</span> or <span className="border border-theme-sub/20 py-0.5 px-1.5 rounded">Esc</span> to quickly restart
      </div>
    </div>
  );
}
