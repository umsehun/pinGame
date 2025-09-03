import { create } from 'zustand';

interface GameState {
  score: number;
  combo: number;
  increaseScore: (amount: number) => void;
  increaseCombo: () => void;
  resetCombo: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  score: 0,
  combo: 0,
  increaseScore: (amount) => set((state) => ({ score: state.score + amount })),
  increaseCombo: () => set((state) => ({ combo: state.combo + 1 })),
  resetCombo: () => set({ combo: 0 }),
}));
