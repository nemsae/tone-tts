import { writable, derived } from 'svelte/store';
import type { Socket } from 'socket.io-client';
import type {
  Player,
  GameState,
  Twister,
  LeaderboardEntry,
  GameSettings,
  CreateRoomPayload,
  CreateRoomResponse,
  JoinRoomPayload,
  JoinRoomResponse,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  ApiResponse,
} from '@/shared/config';
import { socketService } from '@/shared/socket';
import { setupSocketHandlers } from '@/shared/socket/handlers';

export interface MultiplayerState {
  socket: Socket | null;
  player: Player | null;
  roomCode: string | null;
  game: GameState | null;
  currentTwister: Twister | null;
  roundStartTime: number | null;
  leaderboard: LeaderboardEntry[];
  isConnected: boolean;
  connectionError: string | null;
  isLoading: boolean;
}

const initialState: MultiplayerState = {
  socket: null,
  player: null,
  roomCode: null,
  game: null,
  currentTwister: null,
  roundStartTime: null,
  leaderboard: [],
  isConnected: false,
  connectionError: null,
  isLoading: false,
};

function createMultiplayerStore() {
  const { subscribe, set, update } = writable<MultiplayerState>({ ...initialState });
  let cleanupHandlers: (() => void) | null = null;

  return {
    subscribe,

    connect() {
      const socket = socketService.connect();

      cleanupHandlers = setupSocketHandlers(socket, {
        onConnect: () => {
          update((s) => ({ ...s, isConnected: true, connectionError: null }));
        },
        onDisconnect: () => {
          update((s) => ({ ...s, isConnected: false }));
        },
        onConnectError: (error) => {
          update((s) => ({ ...s, connectionError: error.message }));
        },
        onPlayerJoined: ({ game }) => {
          update((s) => ({ ...s, game }));
        },
        onGameStarted: ({ game, currentTwister, roundStartTime }) => {
          update((s) => ({
            ...s,
            game,
            currentTwister,
            roundStartTime,
          }));
        },
        onPlayerSubmitted: ({ playerId, similarity }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              game: {
                ...s.game,
                players: s.game.players.map((p) =>
                  p.id === playerId ? { ...p, currentScore: similarity } : p
                ),
              },
            };
          });
        },
        onRoundAdvanced: ({ currentRound, currentTwister, roundStartTime }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              currentTwister,
              roundStartTime,
              game: {
                ...s.game,
                currentRound,
                players: s.game.players.map((p) => ({ ...p, currentScore: 0 })),
              },
            };
          });
        },
        onGamePaused: ({ pausedAt }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              game: {
                ...s.game,
                status: 'paused',
                pausedAt,
              },
            };
          });
        },
        onGameResumed: ({ totalPausedTime }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              game: {
                ...s.game,
                status: 'playing',
                pausedAt: null,
                totalPausedTime,
              },
            };
          });
        },
        onGameEnded: ({ leaderboard }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              game: {
                ...s.game,
                status: 'game-over',
              },
              leaderboard,
            };
          });
        },
        onPlayerLeft: ({ players }) => {
          update((s) => {
            if (!s.game) return s;
            return {
              ...s,
              game: {
                ...s.game,
                players,
              },
            };
          });
        },
      });

      update((s) => ({ ...s, socket }));
    },

    disconnect() {
      if (cleanupHandlers) {
        cleanupHandlers();
        cleanupHandlers = null;
      }
      socketService.disconnect();
      set({ ...initialState });
    },

    async createRoom(playerName: string, settings: GameSettings): Promise<boolean> {
      const socket = socketService.getSocket();
      if (!socket) return false;

      update((s) => ({ ...s, isLoading: true }));

      return new Promise((resolve) => {
        const payload: CreateRoomPayload = { playerName, settings };
        socket.emit('create-room', payload, (response: CreateRoomResponse) => {
          if (response.success && response.player && response.game) {
            update((s) => ({
              ...s,
              player: response.player!,
              roomCode: response.roomCode!,
              game: response.game ?? null,
              isLoading: false,
            }));
            resolve(true);
          } else {
            update((s) => ({
              ...s,
              connectionError: response.error || 'Failed to create room',
              isLoading: false,
            }));
            resolve(false);
          }
        });
      });
    },

    async joinRoom(roomCode: string, playerName: string): Promise<boolean> {
      const socket = socketService.getSocket();
      if (!socket) return false;

      update((s) => ({ ...s, isLoading: true }));

      return new Promise((resolve) => {
        const payload: JoinRoomPayload = { roomCode: roomCode.toUpperCase(), playerName };
        socket.emit('join-room', payload, (response: JoinRoomResponse) => {
          if (response.success && response.player && response.game) {
            update((s) => ({
              ...s,
              player: response.player!,
              roomCode: response.roomCode!,
              game: response.game ?? null,
              isLoading: false,
            }));
            resolve(true);
          } else {
            update((s) => ({
              ...s,
              connectionError: response.error || 'Failed to join room',
              isLoading: false,
            }));
            resolve(false);
          }
        });
      });
    },

    async startGame(): Promise<boolean> {
      const socket = socketService.getSocket();
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit('start-game', {}, (response: ApiResponse) => {
          if (!response.success) {
            update((s) => ({ ...s, connectionError: response.error || 'Failed to start game' }));
          }
          resolve(response.success);
        });
      });
    },

    async submitAnswer(transcript: string): Promise<number | null> {
      const socket = socketService.getSocket();
      if (!socket) return null;

      return new Promise((resolve) => {
        const payload: SubmitAnswerPayload = { transcript, timestamp: Date.now() };
        socket.emit('submit-answer', payload, (response: SubmitAnswerResponse) => {
          if (response.success) {
            resolve(response.similarity ?? null);
          } else {
            update((s) => ({ ...s, connectionError: response.error || 'Failed to submit answer' }));
            resolve(null);
          }
        });
      });
    },

    async pauseGame(): Promise<boolean> {
      const socket = socketService.getSocket();
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit('pause-game', {}, (response: ApiResponse) => {
          resolve(response.success);
        });
      });
    },

    async resumeGame(): Promise<boolean> {
      const socket = socketService.getSocket();
      if (!socket) return false;

      return new Promise((resolve) => {
        socket.emit('resume-game', {}, (response: ApiResponse) => {
          resolve(response.success);
        });
      });
    },

    clearError() {
      update((s) => ({ ...s, connectionError: null }));
    },

    reset() {
      if (cleanupHandlers) {
        cleanupHandlers();
        cleanupHandlers = null;
      }
      set({ ...initialState });
    },
  };
}

export const multiplayerStore = createMultiplayerStore();

export const players = derived(multiplayerStore, ($store) => $store.game?.players ?? []);
export const gameStatus = derived(multiplayerStore, ($store) => $store.game?.status ?? 'lobby');
export const isHost = derived(multiplayerStore, ($store) => $store.player?.isHost ?? false);
export const currentTwister = derived(multiplayerStore, ($store) => $store.currentTwister);
export const roundStartTime = derived(multiplayerStore, ($store) => $store.roundStartTime);
export const leaderboard = derived(multiplayerStore, ($store) => $store.leaderboard);
