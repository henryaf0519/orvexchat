import React, { useState, useRef, useEffect } from 'react';

// Los íconos SVG de Play y Pausa se mantienen igual
const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 00-.75.75v12c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75h-3zm7.5 0a.75.75 0 00-.75.75v12c0 .414.336.75.75.75h3a.75.75 0 00.75-.75v-12a.75.75 0 00-.75-.75h-3z" clipRule="evenodd" />
  </svg>
);

export default function AudioPlayer({ src, isAgent }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const textColor = isAgent ? 'text-indigo-200' : 'text-gray-500';
  const headerColor = isAgent ? 'text-indigo-100 font-semibold' : 'text-gray-700 font-semibold';
  const progressBgColor = isAgent ? 'bg-indigo-300' : 'bg-gray-400';
  const progressFgColor = isAgent ? 'bg-white' : 'bg-indigo-600';

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    const handleEnd = () => setIsPlaying(false);

    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnd);

    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnd);
    };
  }, []);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds) || timeInSeconds === 0) return '0:00';
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (currentTime / duration) * 100 || 0;

  return (
    <div className="flex flex-col p-2 w-64">
      {/* Etiqueta de audio oculta */}
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* ✅ 1. Encabezado "Audio" */}
      <div className={`text-sm px-2 pb-1 ${headerColor}`}>
        Audio
      </div>

      {/* ✅ 2. Contenedor centrado para el botón y la barra */}
      <div className="flex items-center gap-3 px-2">
        {/* Botón de Play/Pausa */}
        <button onClick={togglePlayPause} className={`flex-shrink-0 ${textColor.replace('text', 'hover:text')}`}>
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Barra de progreso */}
        <div className={`w-full h-1 rounded-full ${progressBgColor}`}>
          <div
            style={{ width: `${progressPercentage}%` }}
            className={`h-full rounded-full ${progressFgColor}`}
          />
        </div>
      </div>

      {/* Tiempo transcurrido/total */}
      <div className={`text-xs text-right mt-1 pr-2 ${textColor}`}>
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );
}