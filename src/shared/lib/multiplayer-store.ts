import { writable } from 'svelte/store';
import type { Socket } from 'socket.io-client';
import type {
  Player,
  GameState,
  LeaderboardEntry,
  Twister,
  CreateRoomResponse,
  JoinRoomResponse,
  GetRoomStateResponse,
  PlayerJoinedEvent,
  GameStartedEvent,
  PlayerSubmittedEvent,
  RoundAdvancedEvent,
  GamePausedEvent,
  GameResumedEvent,
  GameEndedEvent,
  PlayerLeftEvent,
} from './multiplayer-types';

interface MultiplayerGameStore {
  socket: Socket | null;
  player: Player | null;
  roomCode: string | null;
  game: GameState | null;
  isConnected: boolean;
  error: string | null;
  currentTwister: Twister | null;
  roundStartTime: number | null;
  leaderboard: LeaderboardEntry[];
}

function createMultiplayerGameStore() {
  const { subscribe, set, update } = writable<MultiplayerGameStore>({
    socket: null,
    player: null,
    roomCode: null,
    game: null,
    isConnected: false,
    error: null,
    currentTwister: null,
    roundStartTime: null,
    leaderboard: [],
  });

  return {
    subscribe,

    setSocket: (socket: Socket | null) => update((s) => ({ ...s, socket })),

    setPlayer: (player: Player | null) => update((s) => ({ ...s, player })),

    setRoomCode: (roomCode: string | null) => update((s) => ({ ...s, roomCode })),

    setGame: (game: GameState | null) => update((s) => ({ ...s, game })),

    updateGame: (updater: (game: GameState) => GameState) =>
      update((s) => ({ ...s, game: s.game ? updater(s.game) : null })),

    setConnected: (isConnected: boolean) => update((s) => ({ ...s, isConnected })),

    setError: (error: string | null) => update((s) => ({ ...s, error })),

    setCurrentTwister: (twister: Twister | null) =>
      update((s) => ({ ...s, currentTwister: twister })),

    setRoundStartTime: (time: number | null) => update((s) => ({ ...s, roundStartTime: time })),

    setLeaderboard: (leaderboard: LeaderboardEntry[]) => update((s) => ({ ...s, leaderboard })),

    handleCreateRoom: (response: CreateRoomResponse) => {
      update((s) => ({
        ...s,
        player: response.player,
        roomCode: response.roomCode,
        game: response.game,
        error: null,
      }));
    },

    handleJoinRoom: (response: JoinRoomResponse) => {
      update((s) => ({
        ...s,
        player: response.player,
        roomCode: response.roomCode,
        game: response.game,
        error: null,
      }));
    },

    handleGetRoomState: (response: GetRoomStateResponse) => {
      update((s) => ({
        ...s,
        roomCode: s.roomCode,
        game: response.game,
        error: null,
      }));
    },

    handlePlayerJoined: (event: PlayerJoinedEvent) => {
      update((s) => ({
        ...s,
        game: event.game,
      }));
    },

    handleGameStarted: (event: GameStartedEvent) => {
      update((s) => ({
        ...s,
        game: event.game,
        currentTwister: event.currentTwister,
        roundStartTime: event.roundStartTime,
      }));
    },

    handlePlayerSubmitted: (event: PlayerSubmittedEvent) => {
      update((s) => ({
        ...s,
        game: s.game
          ? {
              ...s.game,
              players: s.game.players.map((p) =>
                p.id === event.playerId ? { ...p, currentScore: event.similarity } : p
              ),
            }
          : null,
      }));
    },

    handleRoundAdvanced: (event: RoundAdvancedEvent) => {
      update((s) => ({
        ...s,
        game: s.game
          ? {
              ...s.game,
              currentRound: event.currentRound,
              players: s.game.players.map((p) => ({ ...p, currentScore: 0 })),
            }
          : null,
        currentTwister: event.currentTwister,
        roundStartTime: event.roundStartTime,
      }));
    },

    handleGamePaused: (event: GamePausedEvent) => {
      update((s) => ({
        ...s,
        game: s.game
          ? {
              ...s.game,
              status: 'paused',
              pausedAt: event.pausedAt,
            }
          : null,
      }));
    },

    handleGameResumed: (event: GameResumedEvent) => {
      update((s) => ({
        ...s,
        game: s.game
          ? {
              ...s.game,
              status: 'playing',
              pausedAt: null,
              totalPausedTime: event.totalPausedTime,
            }
          : null,
      }));
    },

    handleGameEnded: (event: GameEndedEvent) => {
      update((s) => ({
        ...s,
        game: s.game ? { ...s.game, status: 'game-over' } : null,
        leaderboard: event.leaderboard,
      }));
    },

    handlePlayerLeft: (event: PlayerLeftEvent) => {
      update((s) => ({
        ...s,
        game: s.game ? { ...s.game, players: event.players } : null,
      }));
    },

    reset: () =>
      set({
        socket: null,
        player: null,
        roomCode: null,
        game: null,
        isConnected: false,
        error: null,
        currentTwister: null,
        roundStartTime: null,
        leaderboard: [],
      }),
  };
}

export const multiplayerGameStore = createMultiplayerGameStore();

export const players = (store: MultiplayerGameStore) => store.game?.players ?? [];
export const currentTwister = (store: MultiplayerGameStore) => {
  if (!store.game || store.game.currentRound < 0) return null;
  return store.game.twisters[store.game.currentRound] ?? null;
};
export const gameStatus = (store: MultiplayerGameStore) => store.game?.status ?? 'lobby';
export const isHost = (store: MultiplayerGameStore) => store.player?.isHost ?? false;
