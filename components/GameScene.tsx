import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Chess, Move } from 'chess.js';
import { Board } from './Board';
import { PieceGeometry } from './PieceGeometry';
import { PieceType, PieceColor, SkinType, CameraMode, AIResponse } from '../types';
import { getBestMove } from '../services/geminiService';

interface GameSceneProps {
  skin: SkinType;
  cameraMode: CameraMode;
  setLastCommentary: (c: string) => void;
  isAiThinking: boolean;
  setIsAiThinking: (b: boolean) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  skin, 
  cameraMode, 
  setLastCommentary,
  isAiThinking,
  setIsAiThinking
}) => {
  const chess = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 4, y: 1 }); // Start at e2 (White pawn)
  const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);

  // Maps algebraic 'e4' to [x, z] coords for 3D space
  const squareToCoords = (square: string): [number, number] => {
    const file = square.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(square[1]) - 1;   // '1' -> 0
    return [file - 3.5, rank - 3.5];
  };

  const coordsToSquare = (x: number, y: number): string => {
    const file = String.fromCharCode(97 + x);
    const rank = String(y + 1);
    return `${file}${rank}`;
  };

  // Handle User Input (WASD + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAiThinking) return; // Block input during AI turn

      const { key } = e;
      setCursorPos((prev) => {
        let newX = prev.x;
        let newY = prev.y;

        if (key === 'w' || key === 'W') newY = Math.min(newY + 1, 7);
        if (key === 's' || key === 'S') newY = Math.max(newY - 1, 0);
        if (key === 'a' || key === 'A') newX = Math.max(newX - 1, 0);
        if (key === 'd' || key === 'D') newX = Math.min(newX + 1, 7);

        return { x: newX, y: newY };
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiThinking]); // Re-bind when AI state changes

  // Execute logic on spacebar (Separate effect to access latest state)
  useEffect(() => {
    const handleAction = (e: KeyboardEvent) => {
        if (isAiThinking) return;
        if (e.key === ' ' || e.key === 'Enter') {
            const targetSquare = coordsToSquare(cursorPos.x, cursorPos.y);
            
            // If we have a selection, try to move
            if (selectedSquare) {
                // Check if it's a valid move
                const moves = chess.moves({ square: selectedSquare as any, verbose: true });
                const move = moves.find(m => m.to === targetSquare);
                
                if (move) {
                    // Execute Move
                    try {
                        chess.move({ from: selectedSquare, to: targetSquare, promotion: 'q' });
                        setFen(chess.fen());
                        setLastMove({ from: selectedSquare, to: targetSquare });
                        setSelectedSquare(null);
                        setValidMoves([]);
                        
                        // Trigger AI
                        setTimeout(() => makeAiMove(), 500);
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    // If clicking a different piece of own color, switch selection
                    const piece = chess.get(targetSquare as any);
                    if (piece && piece.color === 'w') {
                        setSelectedSquare(targetSquare);
                        const valid = chess.moves({ square: targetSquare as any, verbose: true }).map(m => m.to);
                        setValidMoves(valid);
                    } else {
                        // Deselect
                        setSelectedSquare(null);
                        setValidMoves([]);
                    }
                }
            } else {
                // Select piece
                const piece = chess.get(targetSquare as any);
                if (piece && piece.color === 'w') {
                    setSelectedSquare(targetSquare);
                    const valid = chess.moves({ square: targetSquare as any, verbose: true }).map(m => m.to);
                    setValidMoves(valid);
                }
            }
        }
    };
    window.addEventListener('keydown', handleAction);
    return () => window.removeEventListener('keydown', handleAction);
  }, [cursorPos, selectedSquare, chess, isAiThinking]);


  const makeAiMove = async () => {
    if (chess.isGameOver()) {
        setLastCommentary("Game Over.");
        return;
    }

    setIsAiThinking(true);
    setLastCommentary("Thinking...");

    const moves = chess.moves({ verbose: true });
    const moveStrings = moves.map(m => m.from + m.to); // e2e4 format

    const aiRes: AIResponse = await getBestMove(chess.fen(), moveStrings);

    try {
        // AI response is 'e2e4' format usually, chess.move needs object or relaxed string
        chess.move(aiRes.move); // chess.js is smart enough for "e2e4" often, or standard notation
        setFen(chess.fen());
        setLastCommentary(aiRes.commentary);
        
        // Parse move for highlight
        const history = chess.history({ verbose: true });
        const last = history[history.length - 1];
        setLastMove({ from: last.from, to: last.to });

    } catch (e) {
        console.error("Move failed", e);
        // Fallback random
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        chess.move(randomMove);
        setFen(chess.fen());
        setLastCommentary("I decided to move quickly.");
        setLastMove({ from: randomMove.from, to: randomMove.to });
    }
    
    setIsAiThinking(false);
  };

  // Camera Logic
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  // Track previous target to calculate delta for "Follow" mode
  const prevTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const [targetX, targetZ] = [cursorPos.x - 3.5, cursorPos.y - 3.5];
    
    if (cameraMode === CameraMode.EMBODIED) {
        const idealTarget = new THREE.Vector3(targetX, 0, targetZ);
        
        // 1. Smoothly move the orbit target to the selected piece
        controlsRef.current.target.lerp(idealTarget, 5 * delta);
        
        // 2. Calculate the movement delta of the target this frame
        const currentTarget = controlsRef.current.target;
        const moveDelta = new THREE.Vector3().subVectors(currentTarget, prevTarget.current);
        
        // 3. Apply this delta to the camera position
        // This creates a "Follow" effect: the camera moves ALONG with the piece, 
        // but maintains its relative rotation/zoom set by the user.
        camera.position.add(moveDelta);
        
        // Update tracker
        prevTarget.current.copy(currentTarget);

    } else {
        // ORBIT MODE: Revert target to center
        const center = new THREE.Vector3(0, 0, 0);
        controlsRef.current.target.lerp(center, 2 * delta);
        
        // Update tracker so switching back doesn't cause jumps
        prevTarget.current.copy(controlsRef.current.target);
    }
    
    controlsRef.current.update();
  });

  // Initial setup for prevTarget to avoid jump at start
  useEffect(() => {
      if (controlsRef.current) {
          prevTarget.current.copy(controlsRef.current.target);
      }
  }, []);

  // Render Pieces
  const board = chess.board();
  const pieces = [];
  
  board.forEach((row, rankIdx) => {
    row.forEach((piece, fileIdx) => {
      if (piece) {
        const x = fileIdx - 3.5;
        const z = (7 - rankIdx) - 3.5;
        
        pieces.push(
          <group key={`${x}-${z}`} position={[x, 0, z]}>
             <PieceGeometry 
                type={piece.type as PieceType} 
                color={piece.color as PieceColor} 
                skin={skin} 
             />
          </group>
        );
      }
    });
  });

  // Cursor Mesh
  const [cursorX, cursorZ] = [cursorPos.x - 3.5, cursorPos.y - 3.5];

  return (
    <>
      <ambientLight intensity={skin === SkinType.NEON ? 0.2 : 0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} castShadow />
      {skin === SkinType.NEON && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      <Environment preset={skin === SkinType.NEON ? 'city' : 'park'} />

      <OrbitControls 
        ref={controlsRef} 
        // Enabled always to allow rotation in both modes
        makeDefault 
        enableDamping
        dampingFactor={0.1}
      />

      <group>
        <Board 
            skin={skin} 
            activeSquare={selectedSquare} 
            validMoves={validMoves} 
            lastMoveSource={lastMove?.from || null}
            lastMoveDest={lastMove?.to || null}
        />
        
        {pieces}

        {/* Player Cursor */}
        <mesh position={[cursorX, 0.05, cursorZ]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.35, 0.4, 32]} />
            <meshBasicMaterial color={selectedSquare ? "#00ff00" : "#ffffff"} transparent opacity={0.8} />
        </mesh>
        <mesh position={[cursorX, 1.5, cursorZ]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.1, 0.3, 4]} />
            <meshBasicMaterial color="white" />
        </mesh>

      </group>
    </>
  );
};