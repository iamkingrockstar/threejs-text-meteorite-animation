import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface BreakingNewsBannerProps {
  meteorText: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const BreakingNewsBanner: React.FC<BreakingNewsBannerProps> = ({
  meteorText,
  isMuted,
  onToggleMute,
}) => {
  const newsHeadlines = [
    `[속보] "${meteorText}" 초대형 메테오 대기권 돌입... 전 세계 천문학계 경악`,
    '한반도 전역에 대피령 발령... "도서관 즉시 폐쇄 조치"',
    '기상청 특보: "재덕이 땜에 세계 멸망 위험"',
    'NASA 분석관: "이 정도 규모의 뒷공부는 지구 자전축을 15도 비틀어버릴 위력"',
    '친구들의 성명 발표: "공부 안 한다며 이 싯폴롬아"',
    '지구방위대 요격 시스템 긴급 가동... "갓생 적당히 살아라"',
    '전국 대학 긴급 휴교 검토... 메테오 낙하 지점 반경 500km 초토화 예보',
  ];

  const [currentHeadlineIdx, setCurrentHeadlineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHeadlineIdx((prev) => (prev + 1) % newsHeadlines.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [newsHeadlines.length]);

  return (
    <div className="absolute top-0 left-0 right-0 z-30 pointer-events-auto">
      {/* Top Red Alert Bar */}
      <div className="bg-red-700/90 text-white border-b-2 border-red-500 backdrop-blur-md px-3 py-1 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="bg-black text-red-500 font-black text-[10px] md:text-xs px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            LIVE 속보
          </div>
          <div className="font-bold text-xs md:text-sm text-yellow-300 truncate">
            {newsHeadlines[currentHeadlineIdx]}
          </div>
        </div>

        {/* Audio Speech Announcement Trigger */}
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={() => soundManager.speakAlert(`${meteorText}! 즉시 공부를 멈추고 잠을 자라!`)}
            className="hidden sm:flex items-center gap-1 bg-red-900/80 hover:bg-red-800 text-white text-[11px] font-bold px-2.5 py-1 rounded-md border border-red-400/40 transition-colors shadow-sm cursor-pointer"
            title="TTS 긴급 경보 음성 재생"
          >
            <span>📢 긴급 방송</span>
          </button>

          <button
            onClick={onToggleMute}
            className="p-1 rounded-md bg-black/40 hover:bg-black/60 text-white transition-colors cursor-pointer"
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>
    </div>
  );
};
