// Shared types between main and renderer process

export type Judgement = 'KOOL' | 'COOL' | 'GOOD' | 'MISS';

export interface GameNote {
  id: number;
  angle: number;
  hit: boolean;
}

export interface Hit {
  id: number;
  angle: number;
  judgement: Judgement;
}

export interface SongData {
    title: string;
    artist: string;
    bpms: { beat: number; bpm: number }[];
    charts: Chart[];
}

export interface Chart {
    type: string;
    description: string;
    difficultyMeter: number;
    notes: Note[];
}

export interface Note {
    beat: number;
    type: 'tap' | 'hold' | 'mine';
    column: number;
    duration?: number;
}

// Electron API type definitions
export interface IElectronAPI {
  selectFile: () => Promise<string | undefined>;
  loadFile: (filePath: string) => Promise<{ smText: string; audioDataUrl: string | null }>;
}

declare global {
  interface Window {
    electron: IElectronAPI;
  }
}
