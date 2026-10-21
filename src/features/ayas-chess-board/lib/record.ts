export const RECORD_STORAGE_KEY = "asrarul-tools:ayas-chess-board:record:v1";

export interface DifficultyRecord {
  w: number;
  l: number;
  d: number;
}

export type RecordStore = Record<string, DifficultyRecord>;
