import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from '../types';

const API_KEY = process.env.API_KEY || '';

let ai: GoogleGenAI | null = null;

// Initialize AI only when needed to avoid premature errors if key is missing
const getAI = () => {
  if (!ai && API_KEY) {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
};

export const getBestMove = async (fen: string, validMoves: string[]): Promise<AIResponse> => {
  const genAI = getAI();
  if (!genAI) {
    // Fallback if no API key is present, returning a random move logic handled by frontend fallback
    // But here we return a mock to prevent crash
    return {
      move: validMoves[Math.floor(Math.random() * validMoves.length)],
      commentary: "I am playing randomly because the API Key is missing.",
    };
  }

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a chess engine. The board state is: ${fen}. 
      The valid moves (in UCI format or algebraic) are: ${validMoves.join(', ')}.
      Select the best strategic move from the list. 
      Return ONLY a JSON object with 'move' (the chosen move string from the list) and 'commentary' (a short, witty, immersive sentence about why you made that move).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.STRING },
            commentary: { type: Type.STRING },
          },
          required: ['move', 'commentary'],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AIResponse;

  } catch (error) {
    console.error("AI Error:", error);
    // Fallback to random valid move on error
    return {
      move: validMoves[Math.floor(Math.random() * validMoves.length)],
      commentary: "Calculations unclear. I shall move instinctively.",
    };
  }
};