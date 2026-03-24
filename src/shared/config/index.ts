import type { Twister, TwisterLength } from '@/shared/vendor';

export type { Twister, TwisterLength };
export type { TwisterTopic } from '@/shared/vendor';

export type GameScreen = 'lobby' | 'playing' | 'paused' | 'game-over';

export interface GameSettings {
  topic: string;
  length: TwisterLength;
  customLength?: number;
  rounds: number;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  currentScore: number;
  isConnected: boolean;
}

export interface RoundResult {
  playerId: string;
  twisterId: string;
  similarity: number;
  completedAt: number;
}

export interface GameState {
  roomCode: string;
  settings: GameSettings;
  players: Player[];
  twisters: Twister[];
  currentRound: number;
  roundResults: RoundResult[];
  status: GameScreen;
  startedAt: number | null;
  pausedAt: number | null;
  totalPausedTime: number;
  currentTwisterStartTime: number | null;
}

export interface CreateRoomPayload {
  playerName: string;
  settings: GameSettings;
}

export interface CreateRoomResponse {
  success: boolean;
  roomCode?: string;
  player?: Player;
  game?: GameState;
  error?: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface JoinRoomResponse {
  success: boolean;
  roomCode?: string;
  player?: Player;
  game?: GameState;
  error?: string;
}

export interface PlayerJoinedEvent {
  player: Player;
  players: Player[];
  game: GameState;
}

export interface GameStartedEvent {
  game: GameState;
  currentTwister: Twister;
  roundStartTime: number;
}

export interface PlayerSubmittedEvent {
  playerId: string;
  similarity: number;
}

export interface RoundAdvancedEvent {
  currentRound: number;
  currentTwister: Twister;
  roundStartTime: number;
}

export interface GamePausedEvent {
  pausedAt: number;
  pausedBy: string;
}

export interface GameResumedEvent {
  resumedAt: number;
  totalPausedTime: number;
}

export interface LeaderboardEntry {
  player: Player;
  accuracy: number;
  time: number;
}

export interface GameEndedEvent {
  leaderboard: LeaderboardEntry[];
}

export interface PlayerLeftEvent {
  playerId: string;
  players: Player[];
}

export interface SubmitAnswerPayload {
  transcript: string;
  timestamp: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  similarity?: number;
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  error?: string;
}

export const ROUND_DURATION = 30000;
export const AUTO_ADVANCE_DELAY = 2000;
export const MAX_PLAYERS = 4;
