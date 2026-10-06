import React from 'react';
import { TelemetryData } from '../types/simulation';
import { AlertTriangle, Compass, Flame, Gauge, Radio, ShieldAlert, Zap } from 'lucide-react';

interface HUDOverlayProps {
  telemetry: TelemetryData;
  targetCity: string;
}

export const HUDOverlay: React.FC<HUDOverlayProps> = ({
  telemetry,
  targetCity,
}) => {
  const getPhaseName = (phase: TelemetryData['phase']) => {
    switch (phase) {
      case 'deep_space':
        return '1단계: 심우주 접근 (Deep Space)';
      case 'reentry':
        return '2단계: 대기권 마찰 발화 (Atmospheric Reentry)';
      case 'terminal':
        return '3단계: 초음속 급강하 (Supersonic Terminal Dive)';
      case 'impact':
        return '4단계: 한반도 충돌 (Cataclysmic Impact)';
      case 'post_impact':
        return '5단계: 뒷공부 완전 봉인 완료 (Sealed Forever)';
    }
  };

  const getPhaseColor = (phase: TelemetryData['phase']) => {
    switch (phase) {
      case 'deep_space':
        return 'text-sky-400 border-sky-500/40 bg-sky-950/40';
      case 'reentry':
        return 'text-amber-400 border-amber-500/40 bg-amber-950/40';
      case 'terminal':
        return 'text-orange-500 border-orange-500/50 bg-orange-950/50 animate-pulse';
      case 'impact':
      case 'post_impact':
        return 'text-red-500 border-red-500/60 bg-red-950/60 animate-bounce';
    }
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 md:p-6 overflow-hidden">
      {/* Sci-Fi Corner Brackets */}
      <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-red-500/60" />
      <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-red-500/60" />
      <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-red-500/60" />
      <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-red-500/60" />

      {/* Top Header Telemetry HUD */}
      <div className="flex flex-wrap items-start justify-between gap-3 z-10">
        {/* Left Telemetry Cluster */}
        <div className="backdrop-blur-md bg-black/60 border border-red-500/30 rounded-xl p-3 md:p-4 text-white shadow-2xl max-w-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="font-mono text-xs font-bold tracking-widest text-red-400">
              KASI & NASA JOINT TRACKING SYS
            </span>
          </div>

          <div className="space-y-1.5 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-400" /> 목표 타겟 지점:
              </span>
              <span className="font-bold text-red-400 tracking-wider">
                {targetCity} [37.5°N, 127.0°E]
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-orange-400" /> 잔여 거리:
              </span>
              <span className="font-bold text-amber-300 text-sm">
                {telemetry.distanceToEarth.toLocaleString()} km
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> 강하 속도:
              </span>
              <span className="font-bold text-yellow-300">
                {telemetry.velocity} km/s (Mach {(telemetry.velocity * 2.9).toFixed(0)})
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-400" /> 표면 플라즈마 온도:
              </span>
              <span className="font-bold text-red-400">
                {telemetry.temperature.toLocaleString()} °C
              </span>
            </div>
          </div>
        </div>

        {/* Center Threat & Phase Indicator */}
        <div className="flex flex-col items-center">
          <div
            className={`border px-4 py-1.5 rounded-full backdrop-blur-md font-mono text-xs md:text-sm font-black tracking-wide shadow-lg ${getPhaseColor(
              telemetry.phase
            )}`}
          >
            {getPhaseName(telemetry.phase)}
          </div>

          {/* Jae-deok Secret Study Power Gauge */}
          <div className="mt-2 backdrop-blur-md bg-black/70 border border-orange-500/40 rounded-xl px-4 py-2 text-center shadow-xl">
            <div className="text-[10px] tracking-widest text-orange-400 font-mono font-bold flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-orange-400" /> 장재덕 뒷공부 수치 (STUDY POWER)
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-amber-300">
              {telemetry.studyPowerLevel.toLocaleString()} <span className="text-xs text-slate-400 font-normal">pts</span>
            </div>
          </div>
        </div>

        {/* Right Radar / Live Telemetry Signal */}
        <div className="hidden lg:flex flex-col items-end backdrop-blur-md bg-black/60 border border-red-500/30 rounded-xl p-3 text-white font-mono text-xs shadow-2xl">
          <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-bold">
            <Radio className="w-3.5 h-3.5 animate-spin" />
            <span>ORBIT DEFENSE GRID ONLINE</span>
          </div>
          <div className="text-slate-400 text-[10px] mt-1">
            IMPACT TIME: <span className="text-amber-400 font-bold">{telemetry.timeToImpact}s</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            SECTOR: <span className="text-red-400 font-bold">KOREA-SEOUL-BUNKER</span>
          </div>
          <div className="w-32 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 h-full transition-all duration-100"
              style={{ width: `${telemetry.progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Reticle Crosshair in Center View */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 hover:opacity-40 transition-opacity">
        <div className="relative w-48 h-48 border border-dashed border-red-400/50 rounded-full flex items-center justify-center">
          <div className="w-24 h-24 border border-red-500/70 rounded-full animate-ping" />
          <div className="absolute w-2 h-2 bg-red-500 rounded-full" />
          <div className="absolute top-0 bottom-0 w-[1px] bg-red-500/40" />
          <div className="absolute left-0 right-0 h-[1px] bg-red-500/40" />
        </div>
      </div>
    </div>
  );
};
