import { useState, useCallback, useEffect } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { HUDOverlay } from './components/HUDOverlay';
import { BreakingNewsBanner } from './components/BreakingNewsBanner';
import { ControlPanel } from './components/ControlPanel';
import { ImpactModal } from './components/ImpactModal';
import { TargetLocator } from './components/TargetLocator';
import { CameraMode, SimulationConfig, TelemetryData } from './types/simulation';
import { soundManager } from './utils/audio';
import { HelpCircle, Keyboard, Volume2 } from 'lucide-react';

export function App() {
  const [config, setConfig] = useState<SimulationConfig>({
    text: '장재덕 뒷공부 그만',
    style: 'magma',
    speedMultiplier: 1,
    enableLasers: true,
    enableSound: true,
    enableParticles: true,
    enableAtmosphereGlow: true,
    meteorScale: 1.0,
    targetCity: '금오공대 정문 앞 뒷공부 벙커',
  });

  const [cameraMode, setCameraMode] = useState<CameraMode>('cinematic');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timelineProgress, setTimelineProgress] = useState<number>(0.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showImpactModal, setShowImpactModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [hasStartedAudio, setHasStartedAudio] = useState<boolean>(false);

  const [telemetry, setTelemetry] = useState<TelemetryData>({
    distanceToEarth: 128000,
    velocity: 28.4,
    temperature: 800,
    studyPowerLevel: 9999,
    timeToImpact: 25.0,
    phase: 'deep_space',
    progress: 0.0,
  });

  // Start sound on first user gesture
  const handleUserGesture = useCallback(() => {
    if (!hasStartedAudio) {
      soundManager.startAmbiance();
      setHasStartedAudio(true);
    }
  }, [hasStartedAudio]);

  const handleConfigChange = useCallback((newConfig: Partial<SimulationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
    if (newConfig.text) {
      // If text changed, reset simulation to enjoy the new meteor!
      setTimelineProgress(0);
      setShowImpactModal(false);
      setIsPaused(false);
    }
  }, []);

  const handleProgressUpdate = useCallback((data: TelemetryData) => {
    setTelemetry(data);
    setTimelineProgress(data.progress);
  }, []);

  const handleImpactTriggered = useCallback(() => {
    setTimeout(() => {
      setShowImpactModal(true);
    }, 1200);
  }, []);

  const handleReset = useCallback(() => {
    setTimelineProgress(0);
    setShowImpactModal(false);
    setIsPaused(false);
    handleUserGesture();
  }, [handleUserGesture]);

  const handleTogglePlay = useCallback(() => {
    setIsPaused((prev) => !prev);
    handleUserGesture();
  }, [handleUserGesture]);

  const handleTimelineSeek = useCallback((progress: number) => {
    setTimelineProgress(progress);
    if (progress < 0.95) {
      setShowImpactModal(false);
    }
    handleUserGesture();
  }, [handleUserGesture]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in text inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      handleUserGesture();

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleReset();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        const modes: CameraMode[] = ['cinematic', 'meteor_chase', 'meteor_pov', 'earth_view', 'iss_orbit', 'orbit'];
        setCameraMode((prev) => {
          const idx = modes.indexOf(prev);
          return modes[(idx + 1) % modes.length];
        });
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleToggleMute();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        setConfig((prev) => ({ ...prev, enableLasers: !prev.enableLasers }));
      } else if (e.key >= '1' && e.key <= '5') {
        const styles: SimulationConfig['style'][] = ['magma', 'cyber_neon', 'gold', 'ice', 'dark_matter'];
        const chosen = styles[parseInt(e.key, 10) - 1];
        if (chosen) {
          setConfig((prev) => ({ ...prev, style: chosen }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleReset, handleToggleMute, handleUserGesture]);

  return (
    <main
      onClick={handleUserGesture}
      className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans"
    >
      {/* 3D WebGL Three.js Scene */}
      <ThreeCanvas
        config={config}
        cameraMode={cameraMode}
        isPaused={isPaused}
        timelineProgress={timelineProgress}
        onProgressUpdate={handleProgressUpdate}
        onImpactTriggered={handleImpactTriggered}
      />

      {/* Breaking News Top Banner */}
      <BreakingNewsBanner
        meteorText={config.text}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Sci-Fi Telemetry HUD & Crosshairs */}
      <HUDOverlay
        telemetry={telemetry}
        targetCity={config.targetCity}
      />

      {/* Korea Peninsula Radar Widget */}
      <TargetLocator progress={telemetry.progress} />

      {/* Floating Control Deck */}
      <ControlPanel
        config={config}
        cameraMode={cameraMode}
        isPaused={isPaused}
        timelineProgress={timelineProgress}
        onConfigChange={handleConfigChange}
        onCameraChange={setCameraMode}
        onTogglePlay={handleTogglePlay}
        onTimelineSeek={handleTimelineSeek}
        onReset={handleReset}
      />

      {/* Quick Keyboard Shortcuts & Audio hint badge */}
      <div className="hidden lg:flex absolute bottom-4 right-6 z-20 items-center gap-2 pointer-events-auto">
        <button
          onClick={() => setShowHelpModal(true)}
          className="backdrop-blur-md bg-black/60 hover:bg-black/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg"
        >
          <Keyboard className="w-3.5 h-3.5 text-red-400" />
          <span>단축키 안내</span>
        </button>

        {!hasStartedAudio && (
          <div className="backdrop-blur-md bg-red-950/80 border border-red-500/50 rounded-xl px-3 py-1.5 text-xs text-yellow-300 flex items-center gap-1.5 animate-pulse">
            <Volume2 className="w-3.5 h-3.5" />
            <span>화면을 클릭하면 우주 음향이 재생됩니다</span>
          </div>
        )}
      </div>

      {/* Post-Impact Ban Pledge Modal */}
      <ImpactModal
        meteorText={config.text}
        isOpen={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        onReplay={handleReset}
      />

      {/* Keyboard Shortcuts Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 max-w-sm w-full text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-red-400">
                <HelpCircle className="w-4 h-4" />
                <span>키보드 단축키 (Shortcuts)</span>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">스페이스바 (Space)</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">재생 / 일시정지</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">R 키</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">처음부터 재발사</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">C 키</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">카메라 뷰 변경</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">1 ~ 5 숫자키</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">운석 스타일 전환</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">L 키</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">요격 레이저 토글</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">M 키</span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-300">음소거 토글</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
export default App;
