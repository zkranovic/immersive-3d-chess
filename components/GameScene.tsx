import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Chess } from 'chess.js';
import { Board } from './Board';
import { PieceGeometry } from './PieceGeometry';
import { PieceType, PieceColor, SkinType, CameraMode, AIResponse } from '../types';
import { getBestMove } from '../services/geminiService';

interface GameSceneProps {
  skin: SkinType;
  cameraMode: CameraMode;
  playerColor: PieceColor;
  setLastCommentary: (c: string) => void;
  isAiThinking: boolean;
  setIsAiThinking: (b: boolean) => void;
}

export const GameScene: React.FC<GameSceneProps> = ({ 
  skin, 
  cameraMode,
  playerColor,
  setLastCommentary,
  isAiThinking,
  setIsAiThinking
}) => {
  const chess = useMemo(() => new Chess(), []);
  const [fen, setFen] = useState(chess.fen());
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [cursorPos, setCursorPos] = useState({ x: 4, y: 1 }); 
  const [lastMove, setLastMove] = useState<{ from: string, to: string } | null>(null);
  
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  // -- Effects --

  // 1. Handle Game Reset & Camera Position on Color Change
  useEffect(() => {
    chess.reset();
    setFen(chess.fen());
    setLastMove(null);
    setValidMoves([]);
    setSelectedSquare(null);
    setLastCommentary(playerColor === PieceColor.WHITE ? "Game started. Your move." : "Game started. I shall move first.");
    
    // Reset Cursor
    if (playerColor === PieceColor.WHITE) {
       setCursorPos({ x: 4, y: 1 }); // e2
    } else {
       setCursorPos({ x: 4, y: 6 }); // e7
    }

    // Adjust Camera
    const zPos = playerColor === PieceColor.WHITE ? -8 : 8;
    // Using set to update position immediately
    camera.position.set(0, 8, zPos);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      prevTarget.current.set(0,0,0);
    }
  }, [playerColor, chess, camera]); // Added chess/camera to deps for completeness

  // 2. Trigger AI if turn doesn't match player color
  useEffect(() => {
    if (!chess.isGameOver() && chess.turn() !== playerColor && !isAiThinking) {
        makeAiMove();
    }
  }, [fen, playerColor]); // FEN update signals turn change

  // Maps algebraic 'e4' to [x, z] coords for 3D space
  const coordsToSquare = (x: number, y: number): string => {
    const file = String.fromCharCode(97 + x);
    const rank = String(y + 1);
    return `${file}${rank}`;
  };

  // Handle User Input (WASD + Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAiThinking) return; // Block input during AI turn
      if (chess.turn() !== playerColor) return; // Block input if not player turn (redundancy)

      const { key } = e;
      const isWhite = playerColor === PieceColor.WHITE;

      setCursorPos((prev) => {
        let dx = 0;
        let dy = 0;

        if (key === 'w' || key === 'W') dy = 1;
        if (key === 's' || key === 'S') dy = -1;
        if (key === 'a' || key === 'A') dx = -1;
        if (key === 'd' || key === 'D') dx = 1;

        // If playing Black, invert controls because camera is on opposite side
        if (!isWhite) {
            dx = -dx;
            dy = -dy;
        }

        const newX = Math.max(0, Math.min(7, prev.x + dx));
        const newY = Math.max(0, Math.min(7, prev.y + dy));

        return { x: newX, y: newY };
      });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAiThinking, playerColor, chess]);

  // Execute logic on spacebar
  useEffect(() => {
    const handleAction = (e: KeyboardEvent) => {
        if (isAiThinking) return;
        if (chess.turn() !== playerColor) return;

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
                        // AI Trigger handled by Effect on FEN change
                    } catch (err) {
                        console.error(err);
                    }
                } else {
                    // If clicking a different piece of own color, switch selection
                    const piece = chess.get(targetSquare as any);
                    if (piece && piece.color === playerColor) {
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
                if (piece && piece.color === playerColor) {
                    setSelectedSquare(targetSquare);
                    const valid = chess.moves({ square: targetSquare as any, verbose: true }).map(m => m.to);
                    setValidMoves(valid);
                }
            }
        }
    };
    window.addEventListener('keydown', handleAction);
    return () => window.removeEventListener('keydown', handleAction);
  }, [cursorPos, selectedSquare, chess, isAiThinking, playerColor]);


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
        chess.move(aiRes.move); 
        setFen(chess.fen());
        setLastCommentary(aiRes.commentary);
        
        // Parse move for highlight
        const history = chess.history({ verbose: true });
        const last = history[history.length - 1];
        setLastMove({ from: last.from, to: last.to });

    } catch (e) {
        console.error("Move failed", e);
        const randomMove = moves[Math.floor(Math.random() * moves.length)];
        if (randomMove) {
            chess.move(randomMove);
            setFen(chess.fen());
            setLastCommentary("I decided to move quickly.");
            setLastMove({ from: randomMove.from, to: randomMove.to });
        }
    }
    
    setIsAiThinking(false);
  };

  // Camera Logic
  const prevTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    if (!controlsRef.current) return;

    const [targetX, targetZ] = [cursorPos.x - 3.5, cursorPos.y - 3.5];
    
    if (cameraMode === CameraMode.EMBODIED) {
        const idealTarget = new THREE.Vector3(targetX, 0, targetZ);
        controlsRef.current.target.lerp(idealTarget, 5 * delta);
        
        const currentTarget = controlsRef.current.target;
        const moveDelta = new THREE.Vector3().subVectors(currentTarget, prevTarget.current);
        camera.position.add(moveDelta);
        prevTarget.current.copy(currentTarget);

    } else {
        const center = new THREE.Vector3(0, 0, 0);
        controlsRef.current.target.lerp(center, 2 * delta);
        prevTarget.current.copy(controlsRef.current.target);
    }
    
    controlsRef.current.update();
  });

  // Render Pieces
  const board = chess.board();
  const pieces = [];
  
  board.forEach((row, rankIdx) => {
    row.forEach((piece, fileIdx) => {
      if (piece) {
        const x = fileIdx - 3.5;
        // rankIdx 0 is Rank 8 (Back Rank Black). z = 3.5
        // rankIdx 7 is Rank 1 (Back Rank White). z = -3.5
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
            <meshBasicMaterial 
                color={isAiThinking ? "#ff0000" : (selectedSquare ? "#00ff00" : "#ffffff")} 
                transparent 
                opacity={0.8} 
            />
        </mesh>
        {/* Floating Pointer above cursor */}
        <mesh position={[cursorX, 1.5, cursorZ]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.1, 0.3, 4]} />
            <meshBasicMaterial color={isAiThinking ? "#ff0000" : "white"} />
        </mesh>

      </group>
    </>
  );
};