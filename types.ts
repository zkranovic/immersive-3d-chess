export enum PieceType {
  PAWN = 'p',
  ROOK = 'r',
  KNIGHT = 'n',
  BISHOP = 'b',
  QUEEN = 'q',
  KING = 'k',
}

export enum PieceColor {
  WHITE = 'w',
  BLACK = 'b',
}

export enum SkinType {
  CLASSIC = 'Classic',
  NEON = 'Neon Cyber',
  KINGDOM = 'Golden Kingdom',
}

export enum CameraMode {
  ORBIT = 'Orbit',
  EMBODIED = 'Embodied (First Person)',
}

export interface ChessMove {
  from: string;
  to: string;
  promotion?: string;
}

export interface BoardSquare {
  square: string;
  type: PieceType;
  color: PieceColor;
}

export interface AIResponse {
  move: string; // e.g., "e2e4"
  commentary: string;
}