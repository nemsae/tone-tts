import type { Twister, TwisterLength } from '@/shared/vendor';
import type {
  ClientCreateRoomDto,
  ClientJoinRoomDto,
  ClientMultiplayerGameSettings,
} from './validation';
import type { SubmitAnswerDto } from '@jaysonder/tts-validation';

export type { Twister, TwisterLength };

export type GameScreen = 'lobby' | 'playing' | 'paused' | 'game-over';

export type GameSettings = ClientMultiplayerGameSettings;

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

export interface LeaderboardEntry {
  player: Player;
  accuracy: number;
  time: number;
}

export type CreateRoomPayload = ClientCreateRoomDto;

export type JoinRoomPayload = ClientJoinRoomDto;

export type SubmitAnswerPayload = SubmitAnswerDto;

export interface ApiResponse<T = void> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface CreateRoomResponse {
  roomCode: string;
  player: Player;
  game: GameState;
}

export interface JoinRoomResponse {
  roomCode: string;
  player: Player;
  game: GameState;
}

export interface SubmitAnswerResponse {
  similarity: number;
}

export interface SocketActionAck {
  success: boolean;
  error?: string;
}

export interface CreateRoomAck extends SocketActionAck, CreateRoomResponse {}

export interface JoinRoomAck extends SocketActionAck, JoinRoomResponse {}

export interface SubmitAnswerAck extends SocketActionAck, SubmitAnswerResponse {}

export interface GetRoomStateResponse {
  game: GameState;
  playerId: string;
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

export interface GameEndedEvent {
  leaderboard: LeaderboardEntry[];
}

export interface PlayerLeftEvent {
  playerId: string;
  players: Player[];
}
