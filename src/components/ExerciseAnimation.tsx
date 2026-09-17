import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { PlaySquare, Play } from 'lucide-react';

export const ExerciseAnimation: React.FC<{ muscleGroup: string; videoUrl?: string }> = ({ muscleGroup, videoUrl }) => {
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | undefined>(videoUrl);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  useEffect(() => {
    let objectUrl: string | null = null;
    setError(null);
    
    const resolveUrl = async () => {
      if (videoUrl?.startsWith('localforage:')) {
        try {
          console.log('Attempting to load video from localforage:', videoUrl);
          const fileData = await localforage.getItem<string | Blob | ArrayBuffer>(videoUrl);
          console.log('Loaded fileData from localforage:', fileData ? (typeof fileData === 'string' ? `string of length ${fileData.length}` : (fileData instanceof Blob ? 'Blob' : (fileData instanceof ArrayBuffer ? 'ArrayBuffer' : typeof fileData))) : 'null');
          if (fileData) {
            if (typeof fileData === 'string' && fileData.startsWith('data:')) {
              setResolvedVideoUrl(fileData);
            } else if (fileData instanceof Blob) {
              objectUrl = URL.createObjectURL(fileData);
              setResolvedVideoUrl(objectUrl);
            } else if (fileData instanceof ArrayBuffer) {
              const blob = new Blob([fileData], { type: 'video/mp4' });
              objectUrl = URL.createObjectURL(blob);
              setResolvedVideoUrl(objectUrl);
            } else {
              console.error('Retrieved file is not a valid format:', fileData);
              setError('Formato file non valido');
            }
          } else {
            console.error('File video non trovato in localforage per:', videoUrl);
            setError('File video non trovato');
          }
        } catch (err) {
          console.error('Error loading video from localforage:', err);
          setError('Errore di caricamento');
        }
      } else {
        setResolvedVideoUrl(videoUrl);
      }
    };

    resolveUrl();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [videoUrl]);



  if (error) {
    return (
      <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center text-red-500 p-4 text-center">
        <PlaySquare className="w-12 h-12 mb-2 opacity-50" />
        <span className="text-sm font-medium">{error}</span>
      </div>
    );
  }

  if (resolvedVideoUrl) {
    if (resolvedVideoUrl.startsWith('blob:') || resolvedVideoUrl.startsWith('data:') || resolvedVideoUrl.endsWith('.mp4') || resolvedVideoUrl.endsWith('.webm') || videoUrl?.startsWith('localforage:')) {
      console.log('Rendering video element with src:', resolvedVideoUrl.substring(0, 50) + '...');
      return (
        <div className="relative w-full h-full">
          <video 
            ref={videoRef}
            src={resolvedVideoUrl} 
            className="w-full h-full object-cover" 
            controls={isPlaying}
            playsInline 
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />
          {!isPlaying && (
            <button 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors z-10"
              aria-label="Play video"
            >
              <div className="bg-brand-950 text-white rounded-full p-4 shadow-lg transform transition-transform hover:scale-110">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </div>
            </button>
          )}
        </div>
      );
    } else if (resolvedVideoUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
      return (
        <img 
          src={resolvedVideoUrl} 
          alt="Exercise" 
          className="w-full h-full object-cover" 
        />
      );
    }
  }

  return (
    <div className="w-full h-full bg-neutral-100 flex flex-col items-center justify-center text-neutral-400">
      <PlaySquare className="w-12 h-12 mb-2 opacity-50" />
      <span className="text-sm font-medium">Nessun video disponibile</span>
    </div>
  );
};
