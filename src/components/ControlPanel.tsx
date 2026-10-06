import React, { useState } from 'react';
import {
  CameraMode,
  MeteorStyle,
  SimulationConfig,
} from '../types/simulation';
import {
  Camera,
  FastForward,
  Flame,
  Globe,
  Layers,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Type,
  Video,
  Zap,
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ControlPanelProps {
  config: SimulationConfig;
  cameraMode: CameraMode;
  isPaused: boolean;
  timelineProgress: number;
  onConfigChange: (newConfig: Partial<SimulationConfig>) => void;
  onCameraChange: (mode: CameraMode) => void;
  onTogglePlay: () => void;
  onTimelineSeek: (progress: number) => void;
  onReset: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  config,
  cameraMode,
  isPaused,
  timelineProgress,
  onConfigChange,
  onCameraChange,
  onTogglePlay,
  onTimelineSeek,
  onReset,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [inputText, setInputText] = useState(config.text);
  const [activeTab, setActiveTab] = useState<'camera' | 'style' | 'text' | 'defense'>('camera');

  const textPresets = [
    '장재덕 뒷공부 그만',
    '장재덕 벼락치기 금지',
    '야근 전면 금지령',
    '내일부터 다이어트',
    '로또 1등 당첨 기원',
  ];

  const cameraOptions: { id: CameraMode; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'cinematic', label: '영화적 연출', icon: <Video className="w-4 h-4" />, desc: '자동 시네마틱 컷' },
    { id: 'meteor_chase', label: '운석 추적', icon: <Flame className="w-4 h-4" />, desc: '운석 뒤에서 지구 조망' },
    { id: 'meteor_pov', label: '운석 1인칭', icon: <Camera className="w-4 h-4" />, desc: '운석 앞머리에서 직격 시점' },
    { id: 'earth_view', label: '서울 관측소', icon: <Globe className="w-4 h-4" />, desc: '지상에서 하늘 올려다보기' },
    { id: 'iss_orbit', label: '우주정거장', icon: <Moon className="w-4 h-4" />, desc: '고궤도 인공위성 뷰' },
    { id: 'orbit', label: '자유 360°', icon: <Layers className="w-4 h-4" />, desc: '마우스로 360도 자유 회전' },
  ];

  const styleOptions: { id: MeteorStyle; label: string; icon: string; desc: string }[] = [
    { id: 'magma', label: '불타는 마그마', icon: '🌋', desc: '시뻘건 용암 균열 암석' },
    { id: 'cyber_neon', label: '사이버 네온', icon: '⚡', desc: 'SF 사이버펑크 둠스데이' },
    { id: 'gold', label: '황금 재덕', icon: '👑', desc: '번쩍이는 24K 순금 운석' },
    { id: 'ice', label: '극저온 혜성', icon: '❄️', desc: '차가운 푸른 얼음 혜성' },
    { id: 'dark_matter', label: '암흑 물질', icon: '🌌', desc: '보랏빛 시공간 왜곡' },
  ];

  const handleApplyText = (textToApply: string) => {
    if (!textToApply.trim()) return;
    onConfigChange({ text: textToApply.trim() });
    soundManager.speakAlert(`${textToApply.trim()} 운석 생성 완료!`);
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto md:w-[480px] z-20 pointer-events-auto">
      <div className="backdrop-blur-xl bg-slate-950/85 border border-slate-700/60 rounded-2xl p-4 text-white shadow-2xl transition-all duration-300">
        
        {/* Playback & Timeline Controls */}
        <div className="space-y-3 mb-3">
          {/* Progress Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1 text-sky-400">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> 심우주 (0%)
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> 대기권 (40%)
              </span>
              <span className="flex items-center gap-1 text-red-500 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> 충돌 (100%)
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.002"
              value={timelineProgress}
              onChange={(e) => onTimelineSeek(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
            />
          </div>

          {/* Buttons bar */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={onTogglePlay}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4 fill-white" />}
                <span>{isPaused ? '재생' : '일시정지'}</span>
              </button>

              <button
                onClick={onReset}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-medium text-xs border border-slate-600/50 transition-colors cursor-pointer"
                title="처음으로 되감기"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>재발사</span>
              </button>
            </div>

            {/* Speed Multiplier */}
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-700/60">
              <FastForward className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onConfigChange({ speedMultiplier: spd })}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    config.speedMultiplier === spd
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 pb-2 mb-3 gap-1 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => { setActiveTab('camera'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'camera' && isOpen ? 'bg-red-600/30 text-red-400 border border-red-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>카메라 뷰</span>
          </button>

          <button
            onClick={() => { setActiveTab('style'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'style' && isOpen ? 'bg-orange-600/30 text-orange-400 border border-orange-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>운석 스타일</span>
          </button>

          <button
            onClick={() => { setActiveTab('text'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'text' && isOpen ? 'bg-amber-600/30 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>글자 변경</span>
          </button>

          <button
            onClick={() => { setActiveTab('defense'); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer shrink-0 ${
              activeTab === 'defense' && isOpen ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>요격 레이저</span>
          </button>
        </div>

        {/* Tab Content */}
        {isOpen && (
          <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
            {/* 1. CAMERA TAB */}
            {activeTab === 'camera' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {cameraOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => onCameraChange(opt.id)}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      cameraMode === opt.id
                        ? 'border-red-500 bg-red-950/60 shadow-lg text-white ring-1 ring-red-500'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{opt.label}</span>
                      <span className={cameraMode === opt.id ? 'text-red-400' : 'text-slate-400'}>
                        {opt.icon}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 2. STYLE TAB */}
            {activeTab === 'style' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {styleOptions.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => onConfigChange({ style: st.id })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      config.style === st.id
                        ? 'border-orange-500 bg-orange-950/60 shadow-lg text-white ring-1 ring-orange-500'
                        : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{st.label}</span>
                      <span className="text-base">{st.icon}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{st.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. CUSTOM TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="운석 글자 입력 (예: 장재덕 뒷공부 그만)"
                    maxLength={25}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={() => handleApplyText(inputText)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl transition-colors shrink-0 shadow cursor-pointer"
                  >
                    생성하기
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-slate-400 w-full">추천 프리셋:</span>
                  {textPresets.map((txt) => (
                    <button
                      key={txt}
                      onClick={() => {
                        setInputText(txt);
                        handleApplyText(txt);
                      }}
                      className="text-[11px] bg-slate-900 hover:bg-slate-800 border border-slate-700/80 px-2.5 py-1 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DEFENSE GRID TAB */}
            {activeTab === 'defense' && (
              <div className="space-y-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-400" /> 지구방위대 요격 레이저 시스템
                    </div>
                    <div className="text-[10px] text-slate-400">
                      인공위성이 뒷공부 운석을 실시간 추적하여 레이저 빔을 발사합니다.
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableLasers}
                      onChange={(e) => onConfigChange({ enableLasers: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
