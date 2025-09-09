import React, { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Play, Pause, Volume2, VolumeX, Download, RotateCcw, FastForward, Rewind } from 'lucide-react';

interface ModernAudioPlayerProps {
  audioSrc: string | null;
  onDownload?: () => void;
}

export const ModernAudioPlayer: React.FC<ModernAudioPlayerProps> = ({ 
  audioSrc, 
  onDownload 
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // تحديث الوقت الحالي
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioSrc]);

  // تحديث الصوت
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // تحديث سرعة التشغيل
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('خطأ في تشغيل الصوت:', error);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current && duration) {
      const newTime = (value[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0] / 100);
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  if (!audioSrc) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-gray-900 border-0 shadow-lg">
        <div className="text-center text-muted-foreground arabic-text">
          لا يوجد ملف صوتي متاح
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-0 shadow-2xl backdrop-blur-sm">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />
      
      {/* موجات الصوت المتحركة */}
      <div className="relative h-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center space-x-1">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className={`bg-primary/30 rounded-full transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : ''
              }`}
              style={{
                width: '3px',
                height: isPlaying 
                  ? `${Math.random() * 40 + 10}px` 
                  : '10px',
                animationDelay: `${i * 50}ms`,
                animationDuration: '1.5s'
              }}
            />
          ))}
        </div>
        
        {/* شريط التقدم المرئي */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-primary-foreground transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-6 space-y-6">
        {/* شريط التقدم */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full [&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/50 [&_[role=slider]]:shadow-lg [&_[role=slider]]:transition-all [&_[role=slider]]:duration-300 hover:[&_[role=slider]]:scale-110"
            disabled={!duration}
          />
          <div className="flex justify-between text-sm text-muted-foreground arabic-text">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* أزرار التحكم الرئيسية */}
        <div className="flex items-center justify-center space-x-4 rtl:space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(-10)}
            className="hover-scale hover:bg-primary/10 transition-all duration-300"
            disabled={!duration}
          >
            <Rewind className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            className="hover-scale hover:bg-primary/10 transition-all duration-300"
            disabled={!duration}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>

          <Button
            onClick={togglePlay}
            disabled={!audioSrc || isLoading}
            className={`w-16 h-16 rounded-full shadow-lg hover-scale transition-all duration-300 ${
              isPlaying 
                ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' 
                : 'bg-gradient-to-br from-primary to-primary-foreground hover:from-primary/90 hover:to-primary-foreground/90'
            }`}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => skip(10)}
            className="hover-scale hover:bg-primary/10 transition-all duration-300"
            disabled={!duration}
          >
            <FastForward className="w-5 h-5" />
          </Button>

          {onDownload && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDownload}
              className="hover-scale hover:bg-primary/10 transition-all duration-300"
            >
              <Download className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* التحكم في الصوت */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMute}
            className="hover-scale hover:bg-primary/10 transition-all duration-300"
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>
          
          <div className="flex-1">
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary/50 [&_[role=slider]]:shadow-md hover:[&_[role=slider]]:scale-110 transition-all duration-300"
            />
          </div>
          
          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>

        {/* التحكم في سرعة التشغيل */}
        <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
          <span className="text-sm text-muted-foreground arabic-text">السرعة:</span>
          <div className="flex space-x-1 rtl:space-x-reverse">
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
              <Button
                key={rate}
                variant={playbackRate === rate ? "default" : "ghost"}
                size="sm"
                onClick={() => setPlaybackRate(rate)}
                className={`text-xs transition-all duration-300 ${
                  playbackRate === rate 
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
                    : 'hover:bg-primary/10 hover-scale'
                }`}
              >
                {rate}x
              </Button>
            ))}
          </div>
        </div>

        {/* معلومات إضافية */}
        {duration > 0 && (
          <div className="text-center space-y-1">
            <div className="text-sm text-muted-foreground arabic-text">
              مدة التشغيل: {formatTime(duration)}
            </div>
            <div className="text-xs text-muted-foreground">
              جودة عالية • WAV
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};