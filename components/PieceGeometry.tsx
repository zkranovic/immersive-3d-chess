import React, { useMemo } from 'react';
import { PieceType, PieceColor, SkinType } from '../types';
import * as THREE from 'three';

interface PieceGeometryProps {
  type: PieceType;
  color: PieceColor;
  skin: SkinType;
}

export const PieceGeometry: React.FC<PieceGeometryProps> = ({ type, color, skin }) => {
  
  const material = useMemo(() => {
    const isWhite = color === PieceColor.WHITE;
    
    if (skin === SkinType.NEON) {
      return new THREE.MeshStandardMaterial({
        color: isWhite ? '#00ffff' : '#ff0055',
        emissive: isWhite ? '#004444' : '#440011',
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8,
      });
    } else if (skin === SkinType.KINGDOM) {
      return new THREE.MeshStandardMaterial({
        color: isWhite ? '#f5e0a6' : '#4a4a4a', // Gold vs Dark Steel
        roughness: 0.3,
        metalness: 1.0,
      });
    } else {
      // Classic
      return new THREE.MeshStandardMaterial({
        color: isWhite ? '#ffffff' : '#333333',
        roughness: 0.5,
        metalness: 0.1,
      });
    }
  }, [color, skin]);

  // Procedural Shapes based on type
  const geometry = useMemo(() => {
    switch (type) {
      case PieceType.PAWN:
        return <cylinderGeometry args={[0.3, 0.4, 1, 16]} />;
      case PieceType.ROOK:
        return <boxGeometry args={[0.7, 1.2, 0.7]} />;
      case PieceType.KNIGHT:
         // Abstract Knight (L shape top)
         return <coneGeometry args={[0.4, 1.2, 4]} />;
      case PieceType.BISHOP:
        return <capsuleGeometry args={[0.35, 1, 4, 16]} />;
      case PieceType.QUEEN:
        return <dodecahedronGeometry args={[0.5]} />;
      case PieceType.KING:
        return <octahedronGeometry args={[0.6]} />;
      default:
        return <boxGeometry args={[0.5, 0.5, 0.5]} />;
    }
  }, [type]);

  // Special adornments for style
  const renderAdornment = () => {
    if (skin === SkinType.NEON && type === PieceType.KING) {
       return (
         <mesh position={[0, 1, 0]}>
            <torusGeometry args={[0.2, 0.05, 16, 32]} />
            <meshBasicMaterial color="white" />
         </mesh>
       )
    }
    return null;
  };

  return (
    <group>
      <mesh position={[0, 0.5, 0]} material={material}>
        {geometry}
      </mesh>
      <mesh position={[0, 0.1, 0]} material={material}>
         <cylinderGeometry args={[0.45, 0.5, 0.2, 16]} />
      </mesh>
      {renderAdornment()}
    </group>
  );
};