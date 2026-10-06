import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, CheckCircle2, Flame, RotateCcw, Share2, ShieldX, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface ImpactModalProps {
  meteorText: string;
  isOpen: boolean;
  onClose: () => void;
  onReplay: () => void;
}

export const ImpactModal: React.FC<ImpactModalProps> = ({
  meteorText,
  isOpen,
  onClose,
  onReplay,
}) => {
  const [isStamped, setIsStamped] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fire victory confetti for saving the world from secret studying!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#ff4500', '#ffd700', '#ff0055', '#00e5ff'],
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStamp = () => {
    setIsStamped(true);
    soundManager.playStampSound();
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.5 },
      colors: ['#ff0000', '#ffffff', '#ffaa00'],
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(
        `🚨 [긴급속보] "${meteorText}" 초대형 메테오가 지구로 떨어졌습니다! 장재덕의 뒷공부가 영구 봉인되었습니다!`
      );
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in pointer-events-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 border-red-500/80 rounded-2xl p-6 text-white shadow-[0_0_50px_rgba(255,0,0,0.5)] overflow-hidden">
        {/* Glowing Top Badge */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-yellow-500 via-red-600 to-orange-500" />

        {/* Header Banner */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-mono font-bold px-3 py-1 rounded-full mb-2">
            <Flame className="w-4 h-4 text-red-500 animate-pulse" />
            <span>METEOR IMPACT SUCCESSFUL</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-orange-400">
            뒷공부 영구 금지 각서
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            지구방위본부 & 천문대 합동 공증 문서 제2025-077호
          </p>
        </div>

        {/* Certificate Body (Parchment Box) */}
        <div className="relative bg-amber-50/5 border border-amber-400/20 rounded-xl p-4 md:p-5 text-slate-200 text-xs md:text-sm space-y-3 leading-relaxed font-serif">
          <div className="flex justify-between border-b border-amber-400/20 pb-2 font-mono text-xs text-amber-300/80">
            <span>대상자: 장재덕 (Jang Jae-deok)</span>
            <span>판결: 뒷공부 즉시 몰수</span>
          </div>

          <p>
            위 본인은 친구들에게 <span className="text-yellow-400 font-bold">"나 어제 시험공부 1도 안 함"</span>이라고 호언장담한 뒤, 밤 11시부터 새벽 4시까지 몰래 불 끄고 스탠드 켜고 뒷공부한 혐의가 명백히 입증되었으므로,
          </p>

          <p>
            금일 떨어진 <span className="text-red-400 font-bold">"{meteorText}"</span> 운석의 초고열 플라즈마 충격파에 의해 향후 일체의 비밀 자습 및 스터디카페 잠입을 <span className="text-red-400 font-bold">영구히 금지</span>할 것을 엄숙히 서약합니다.
          </p>

          {/* Interactive Red Seal Stamp */}
          <div className="pt-2 flex justify-end items-center relative">
            {isStamped ? (
              <div className="border-4 border-red-600 text-red-600 font-black text-xs md:text-sm px-4 py-2 rounded-lg transform -rotate-12 uppercase tracking-widest shadow-2xl animate-scale-in flex items-center gap-1.5 bg-red-950/30">
                <CheckCircle2 className="w-4 h-4 text-red-500" />
                <span>뒷공부 봉인완료 (APPROVED)</span>
              </div>
            ) : (
              <button
                onClick={handleStamp}
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded-xl border border-red-400 shadow-lg transform hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>압류 도장 찍기 (쾅!)</span>
              </button>
            )}
          </div>
        </div>

        {/* Impact Damage Statistics */}
        <div className="grid grid-cols-3 gap-2 my-4 text-center text-[11px] font-mono">
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <span className="text-slate-400 block text-[10px]">운석 충돌구 크기</span>
            <span className="text-orange-400 font-bold">450 km (한반도급)</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <span className="text-slate-400 block text-[10px]">잔여 뒷공부 수치</span>
            <span className="text-emerald-400 font-bold">0 pts (완전 소멸)</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <span className="text-slate-400 block text-[10px]">친구들의 평화도</span>
            <span className="text-sky-400 font-bold">100% 회복</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onReplay}
            className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs md:text-sm py-2.5 rounded-xl shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>메테오 다시 떨어뜨리기</span>
          </button>

          <button
            onClick={handleShare}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl border border-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="속보 텍스트 복사"
          >
            {isCopied ? <Sparkles className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isCopied ? '복사됨!' : '공유'}</span>
          </button>

          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ShieldX className="w-4 h-4" />
            <span>닫기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
