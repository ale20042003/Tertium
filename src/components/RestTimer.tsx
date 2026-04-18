import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Square, Bell } from 'lucide-react';

interface RestTimerProps {
  restString: string;
}

function parseRestTime(restStr: string): number {
  if (!restStr) return 0;
  const str = restStr.toLowerCase();
  let totalSeconds = 0;
  
  const minMatch = str.match(/(\d+)\s*(m|min)/);
  if (minMatch) {
    totalSeconds += parseInt(minMatch[1], 10) * 60;
  }
  
  const secMatch = str.match(/(\d+)\s*(s|sec)/);
  if (secMatch) {
    totalSeconds += parseInt(secMatch[1], 10);
  }
  
  if (!minMatch && !secMatch) {
    const numMatch = str.match(/(\d+)/);
    if (numMatch) {
      totalSeconds += parseInt(numMatch[1], 10);
    }
  }
  
  return totalSeconds;
}

export const RestTimer: React.FC<RestTimerProps> = ({ restString }) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = parseRestTime(restString);

  useEffect(() => {
    // Create audio element for the beep sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft !== null && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => (prev !== null ? prev - 1 : null));
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      setIsFinished(true);
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const startTimer = () => {
    if (totalSeconds > 0) {
      setTimeLeft(totalSeconds);
      setIsActive(true);
      setIsFinished(false);
    }
  };

  const stopTimer = () => {
    setIsActive(false);
    setTimeLeft(null);
    setIsFinished(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-950 px-4 py-3 rounded-2xl border border-neutral-800 flex-1 flex flex-col justify-center relative overflow-hidden">
      <div className="flex justify-between items-start mb-1 relative z-10">
        <p className="text-neutral-500 text-xs font-bold uppercase tracking-wider">Recupero</p>
        {totalSeconds > 0 && !isActive && !isFinished && (
          <button onClick={startTimer} className="text-lime-400 hover:text-lime-300 transition-colors" aria-label="Start timer">
            <Play className="w-4 h-4" fill="currentColor" />
          </button>
        )}
        {isActive && (
          <button onClick={stopTimer} className="text-red-400 hover:text-red-300 transition-colors" aria-label="Stop timer">
            <Square className="w-4 h-4" fill="currentColor" />
          </button>
        )}
        {isFinished && (
          <button onClick={stopTimer} className="text-neutral-400 hover:text-neutral-300 transition-colors" aria-label="Reset timer">
            <Square className="w-4 h-4" fill="currentColor" />
          </button>
        )}
      </div>
      
      <div className="relative z-10">
        {isFinished ? (
          <p className="text-lime-400 font-bold text-sm flex items-center gap-1 animate-pulse mt-1">
            <Bell className="w-4 h-4" /> Terminato!
          </p>
        ) : isActive && timeLeft !== null ? (
          <p className="text-lime-400 font-bold text-2xl font-mono tracking-wider leading-none mt-1">
            {formatTime(timeLeft)}
          </p>
        ) : (
          <p className="text-white font-bold text-lg flex items-center gap-2 mt-1">
            <Clock className="w-4 h-4 text-lime-400" /> {restString}
          </p>
        )}
      </div>

      {/* Progress bar background */}
      {isActive && timeLeft !== null && (
        <div 
          className="absolute bottom-0 left-0 h-1 bg-lime-400/30 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / totalSeconds) * 100}%` }}
        />
      )}
    </div>
  );
};
