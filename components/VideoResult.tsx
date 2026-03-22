
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, {useState, useRef} from 'react';
import { motion } from 'motion/react';
import { AspectRatio } from '../types';
import { ArrowPathIcon, DownloadIcon, SparklesIcon, FileImageIcon, PlusIcon } from './icons';
import { Share2, Maximize2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import gifshot from 'gifshot';

interface VideoResultProps {
  videoUrl: string;
  onRetry: () => void;
  onNewVideo: () => void;
  onExtend: () => void;
  canExtend: boolean;
  aspectRatio: AspectRatio;
}

const VideoResult: React.FC<VideoResultProps> = ({
  videoUrl,
  onRetry,
  onNewVideo,
  onExtend,
  canExtend,
  aspectRatio,
}) => {
  const isPortrait = aspectRatio === AspectRatio.PORTRAIT;
  const [isConvertingGif, setIsConvertingGif] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownloadGif = async (frames: number) => {
    if (!videoUrl) return;
    
    setIsConvertingGif(true);
    setConversionProgress(0);
    
    try {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";

      await new Promise((resolve) => {
        if (video.readyState >= 1) resolve(null);
        else video.onloadedmetadata = () => resolve(null);
      });

      const duration = video.duration;
      const width = isPortrait ? 360 : 640;
      const height = isPortrait ? 640 : 360;
      const step = duration / frames;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      const images: string[] = [];

      for (let i = 0; i < frames; i++) {
        const time = i * step;
        if (time > 0) {
          video.currentTime = time;
          await new Promise((resolve) => {
             const onSeeked = () => {
               video.removeEventListener('seeked', onSeeked);
               resolve(null);
             };
             video.addEventListener('seeked', onSeeked);
          });
        }
        
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          images.push(canvas.toDataURL('image/jpeg', 0.8));
        }
        setConversionProgress(Math.round(((i + 1) / frames) * 90));
      }

      gifshot.createGIF({
        images: images,
        interval: 0.1,
        gifWidth: width,
        gifHeight: height,
        sampleInterval: 10,
      }, (obj) => {
        if (!obj.error) {
          setConversionProgress(100);
          const link = document.createElement('a');
          link.href = obj.image;
          link.download = `video-factory-export-${(frames/10).toFixed(1)}s.gif`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          console.error('GIF generation failed:', obj.errorMsg);
        }
        
        setTimeout(() => {
          setIsConvertingGif(false);
          setConversionProgress(0);
        }, 500);
      });

    } catch (error) {
      console.error('Error preparing GIF:', error);
      setIsConvertingGif(false);
      setConversionProgress(0);
    }
  };

  const getFrames = (divisor: number) => {
    const duration = videoDuration || 8;
    return Math.floor((duration / divisor) * 10);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full flex flex-col gap-6 sm:gap-8 p-4 sm:p-10 bg-[var(--card-bg)] backdrop-blur-3xl rounded-[2rem] sm:rounded-[3rem] border border-[var(--card-border)] shadow-2xl relative overflow-hidden group/result"
    >
      {/* Ambient Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/10 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] sm:text-xs font-bold text-emerald-500 uppercase tracking-[0.2em]">Production Ready</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tighter text-[var(--fg)]">High-Fidelity Output</h2>
        </div>
        <button
          onClick={onNewVideo}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--card-bg)] hover:bg-[var(--card-bg)] text-[var(--fg)] text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-[var(--card-border)] group/new"
        >
          <PlusIcon className="w-4 h-4 group-hover/new:rotate-90 transition-transform" />
          <span>New Production</span>
        </button>
      </div>

      <div className="relative group/player rounded-2xl overflow-hidden border border-[var(--card-border)] bg-black shadow-2xl">
        <div 
          className={`w-full ${
            isPortrait ? 'max-w-[320px] mx-auto aspect-[9/16]' : 'aspect-video'
          } relative`}
        >
          <video
            ref={videoRef}
            src={videoUrl}
            autoPlay
            loop
            muted={isMuted}
            className="w-full h-full object-contain"
            onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
          />
          
          {/* Custom Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/player:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-indigo-400 transition-colors">
                  {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-indigo-400 transition-colors">
                  {isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] sm:text-xs font-mono text-white/80">
                  {videoDuration.toFixed(1)}s
                </span>
                <button className="text-white hover:text-indigo-400 transition-colors">
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 relative z-10">
        <button
          onClick={onRetry}
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[var(--card-bg)] hover:bg-[var(--card-bg)] text-[var(--fg)] font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-all border border-[var(--card-border)]"
        >
          <ArrowPathIcon className="w-4 h-4" />
          <span>Recalibrate</span>
        </button>
        
        <a
          href={videoUrl}
          download="video-factory-export.mp4"
          className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-all shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
        >
          <DownloadIcon className="w-4 h-4" />
          <span>Export MP4</span>
        </a>

        <div className="relative group/export">
          <button
            disabled={isConvertingGif}
            onClick={() => handleDownloadGif(getFrames(1))}
            className="w-full h-full flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[var(--card-bg)] hover:bg-[var(--card-bg)] text-[var(--fg)] font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-all border border-[var(--card-border)] disabled:opacity-50"
          >
            {isConvertingGif ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="tabular-nums">{conversionProgress}%</span>
              </div>
            ) : (
              <>
                <FileImageIcon className="w-4 h-4" />
                <span>Export GIF</span>
              </>
            )}
          </button>
          
          {!isConvertingGif && (
            <div className="absolute bottom-full left-0 mb-3 w-full bg-[var(--bg)] border border-[var(--card-border)] rounded-2xl shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/export:opacity-100 group-hover/export:translate-y-0 group-hover/export:pointer-events-auto transition-all duration-300 z-30 p-1">
              {[
                { label: 'Normal (1:1)', divisor: 1, tag: '1:1' },
                { label: '2x Speed', divisor: 2, tag: 'Fast' },
                { label: '4x Speed', divisor: 4, tag: 'Turbo' }
              ].map((opt) => (
                <button 
                  key={opt.divisor}
                  onClick={() => handleDownloadGif(getFrames(opt.divisor))}
                  className="w-full flex items-center justify-between px-4 py-3 text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--card-bg)] rounded-xl transition-colors text-[var(--muted)] hover:text-[var(--fg)]"
                >
                  <span>{opt.label}</span>
                  <span className="text-[8px] text-indigo-400/50">{opt.tag}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {canExtend ? (
          <button
            onClick={onExtend}
            className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl transition-all shadow-lg shadow-purple-500/20 border border-purple-400/30"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Extend</span>
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 px-4 py-3 sm:py-4 bg-[var(--card-bg)] text-[var(--muted)] font-bold uppercase tracking-widest text-[10px] sm:text-xs rounded-xl border border-[var(--card-border)] opacity-50 cursor-not-allowed">
            <SparklesIcon className="w-4 h-4" />
            <span>Extend</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-[var(--card-border)] relative z-10">
        <div className="flex items-center gap-4">
          <button className="p-2 text-[var(--muted)] hover:text-[var(--fg)] transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-[var(--card-border)]" />
          <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">
            ID: {Math.random().toString(36).substring(7).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">Format</span>
          <span className="px-2 py-0.5 rounded bg-[var(--card-bg)] text-[10px] font-mono text-indigo-400 border border-[var(--card-border)] uppercase">
            {isPortrait ? '9:16' : '16:9'} MP4
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoResult;
