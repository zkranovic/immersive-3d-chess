import React from 'react';
import { CameraMode, SkinType, PieceColor } from '../types';

interface OverlayProps {
  skin: SkinType;
  setSkin: (s: SkinType) => void;
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  playerColor: PieceColor;
  setPlayerColor: (c: PieceColor) => void;
  commentary: string;
  isThinking: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({
  skin,
  setSkin,
  cameraMode,
  setCameraMode,
  playerColor,
  setPlayerColor,
  commentary,
  isThinking
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
      {/* Header / Controls */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className={`text-4xl font-bold tracking-tighter ${skin === SkinType.NEON ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white'}`}>
            IMMERSIVE CHESS
          </h1>
          <p className="text-white/70 text-sm mt-1">Use <span className="font-bold text-white">WASD</span> to move cursor, <span className="font-bold text-white">SPACE</span> to select/move.</p>
        </div>

        <div className="flex flex-col gap-4 bg-black/40 backdrop-blur-md p-4 rounded-lg border border-white/10">
          {/* Skin Selector */}
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Visual Style</label>
            <div className="flex gap-2">
              {Object.values(SkinType).map((s) => (
                <button
                  key={s}
                  onClick={() => setSkin(s)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    skin === s 
                      ? 'bg-white text-black font-bold shadow-lg' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Camera Selector */}
          <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Camera Mode</label>
            <div className="flex gap-2">
              {Object.values(CameraMode).map((m) => (
                <button
                  key={m}
                  onClick={() => setCameraMode(m)}
                  className={`px-3 py-1 text-xs rounded transition-all ${
                    cameraMode === m 
                      ? 'bg-blue-500 text-white font-bold shadow-lg' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

           {/* Player Color Selector */}
           <div>
            <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Play As</label>
            <div className="flex gap-2">
              <button
                onClick={() => setPlayerColor(PieceColor.WHITE)}
                className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-2 ${
                  playerColor === PieceColor.WHITE
                    ? 'bg-white text-black font-bold shadow-lg' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-white border border-black"></span> White
              </button>
              <button
                onClick={() => setPlayerColor(PieceColor.BLACK)}
                className={`px-3 py-1 text-xs rounded transition-all flex items-center gap-2 ${
                  playerColor === PieceColor.BLACK
                    ? 'bg-gray-800 text-white font-bold shadow-lg border border-gray-600' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-black border border-white"></span> Black
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / AI Commentary */}
      <div className="pointer-events-auto max-w-2xl mx-auto w-full">
        <div className={`
          relative overflow-hidden rounded-xl p-6 transition-all
          ${skin === SkinType.NEON 
            ? 'bg-black/80 border border-cyan-500 shadow-[0_0_20px_rgba(0,255,255,0.2)]' 
            : 'bg-slate-900/90 border border-white/10 shadow-2xl'}
        `}>
           {isThinking && (
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />
           )}
           <div className="flex items-start gap-4">
             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold
                ${skin === SkinType.NEON ? 'bg-cyan-900 text-cyan-200' : 'bg-slate-700 text-white'}
             `}>
               AI
             </div>
             <div>
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">Opponent</h3>
               <p className={`text-lg leading-relaxed ${skin === SkinType.NEON ? 'text-cyan-50' : 'text-white'}`}>
                 {commentary || "I await your move, human."}
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};