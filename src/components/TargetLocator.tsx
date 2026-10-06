import React from 'react';
import { Crosshair, MapPin } from 'lucide-react';

interface TargetLocatorProps {
  progress: number;
}

export const TargetLocator: React.FC<TargetLocatorProps> = ({ progress }) => {
  return (
    <div className="hidden sm:block absolute top-14 right-4 z-20 pointer-events-none">
      <div className="backdrop-blur-md bg-black/60 border border-red-500/40 rounded-xl p-2.5 text-white shadow-xl flex items-center gap-3">
        {/* Radar Screen */}
        <div className="relative w-14 h-14 rounded-full border border-red-500/60 bg-red-950/40 flex items-center justify-center overflow-hidden">
          {/* Radar Sweep line */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-red-500/20 to-red-500/40 animate-spin" />
          
          {/* Grid concentric rings */}
          <div className="w-10 h-10 border border-red-500/30 rounded-full" />
          <div className="w-5 h-5 border border-red-500/30 rounded-full" />

          {/* Korea Peninsula Jae-deok Blip */}
          <div className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <div className="absolute w-1.5 h-1.5 bg-yellow-300 rounded-full" />

          <Crosshair className="absolute w-3.5 h-3.5 text-red-400 opacity-60" />
        </div>

        {/* Info */}
        <div className="text-[10px] font-mono leading-tight space-y-0.5">
          <div className="text-red-400 font-bold flex items-center gap-1">
            <MapPin className="w-3 h-3 text-red-500" /> KOREA-TARGET
          </div>
          <div className="text-slate-300">위도: 37.5665° N</div>
          <div className="text-slate-300">경도: 126.9780° E</div>
          <div className="text-amber-400 font-bold">
            LOCK: {progress > 0.8 ? '100% (격돌 임박)' : `${Math.floor(progress * 100)}%`}
          </div>
        </div>
      </div>
    </div>
  );
};
