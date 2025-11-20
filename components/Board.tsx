import React from 'react';
import { Text } from '@react-three/drei';
import { SkinType } from '../types';

interface BoardProps {
  skin: SkinType;
  activeSquare: string | null;
  validMoves: string[];
  lastMoveSource: string | null;
  lastMoveDest: string | null;
}

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

export const Board: React.FC<BoardProps> = ({ 
  skin, 
  activeSquare, 
  validMoves,
  lastMoveSource,
  lastMoveDest
}) => {
  const isNeon = skin === SkinType.NEON;

  return (
    <group>
      {RANKS.map((rank, rankIndex) =>
        FILES.map((file, fileIndex) => {
          const squareName = `${file}${rank}`;
          const isBlack = (rankIndex + fileIndex) % 2 === 1;
          
          let color = isBlack ? '#779556' : '#ebecd0'; // Default Green/White
          
          if (skin === SkinType.NEON) {
            color = isBlack ? '#110022' : '#220044';
          } else if (skin === SkinType.KINGDOM) {
            color = isBlack ? '#4a0d0d' : '#d4bc85';
          }

          // Highlight logic
          const isSelected = activeSquare === squareName;
          const isLastMove = squareName === lastMoveSource || squareName === lastMoveDest;
          const isValidMove = validMoves.includes(squareName);

          const materialColor = isSelected 
            ? '#ffff00' 
            : isLastMove
            ? (isNeon ? '#aa00ff' : '#bbcc44')
            : color;

          return (
            <group key={squareName} position={[fileIndex - 3.5, 0, rankIndex - 3.5]}>
              <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1, 1]} />
                <meshStandardMaterial 
                  color={materialColor} 
                  roughness={isNeon ? 0.2 : 0.8}
                  metalness={isNeon ? 0.5 : 0.1}
                  emissive={isNeon && isValidMove ? '#00ff00' : '#000000'}
                  emissiveIntensity={0.2}
                />
              </mesh>
              {/* Coordinate Labels on edges */}
              {rankIndex === 0 && (
                <Text 
                  position={[0, 0.01, -0.6]} 
                  rotation={[-Math.PI/2,0,0]} 
                  fontSize={0.3} 
                  color={isNeon ? 'white' : 'black'}
                >
                  {file}
                </Text>
              )}
               {fileIndex === 7 && (
                <Text 
                  position={[0.6, 0.01, 0]} 
                  rotation={[-Math.PI/2,0,0]} 
                  fontSize={0.3} 
                  color={isNeon ? 'white' : 'black'}
                >
                  {rank}
                </Text>
              )}
              {isValidMove && (
                 <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
                    <ringGeometry args={[0.2, 0.25, 32]} />
                    <meshBasicMaterial color={isNeon ? "#00ff00" : "#666"} />
                 </mesh>
              )}
            </group>
          );
        })
      )}
      {/* Board Base */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[9, 0.5, 9]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};