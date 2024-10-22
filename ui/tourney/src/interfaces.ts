export interface SimplePlayer {
  name: string;
  rating: number;
  title?: string;
  flair?: string;
  provisional?: boolean;
}

export interface BasePlayer {
  user: LightUser;
  rating: number;
  provisional?: boolean;
  withdraw?: boolean;
  points: number;
  tieBreak: number;
  performance?: number;
  absent: boolean;
}

export type Player = SimplePlayer | BasePlayer;
