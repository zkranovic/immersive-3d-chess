import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { GameScene } from './components/GameScene';
import { Overlay } from './components/Overlay';
import { SkinType, CameraMode, PieceColor } from './types';

const App: React.FC = () => {
  const [skin, setSkin] = useState<SkinType>(SkinType.CLASSIC);
  const [cameraMode, setCameraMode] = useState<CameraMode>(CameraMode.ORBIT);
  const [playerColor, setPlayerColor] = useState<PieceColor>(PieceColor.WHITE);
  const [lastCommentary, setLastCommentary] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 10, -8], fov: 50 }}>
          <GameScene 
            skin={skin} 
            cameraMode={cameraMode}
            playerColor={playerColor}
            setLastCommentary={setLastCommentary}
            isAiThinking={isAiThinking}
            setIsAiThinking={setIsAiThinking}
          />
        </Canvas>
      </div>

      {/* UI Layer */}
      <div className="absolute inset-0 z-10">
        <Overlay 
          skin={skin} 
          setSkin={setSkin} 
          cameraMode={cameraMode} 
          setCameraMode={setCameraMode}
          playerColor={playerColor}
          setPlayerColor={setPlayerColor}
          commentary={lastCommentary}
          isThinking={isAiThinking}
        />
      </div>
    </div>
  );
};

export default App;