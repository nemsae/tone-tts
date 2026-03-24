import type { Socket } from 'socket.io-client';
import type {
  PlayerJoinedEvent,
  GameStartedEvent,
  PlayerSubmittedEvent,
  RoundAdvancedEvent,
  GamePausedEvent,
  GameResumedEvent,
  GameEndedEvent,
  PlayerLeftEvent,
  Twister,
} from '@/shared/config';

export interface MultiplayerCallbacks {
  onPlayerJoined?: (data: PlayerJoinedEvent) => void;
  onGameStarted?: (data: GameStartedEvent) => void;
  onPlayerSubmitted?: (data: PlayerSubmittedEvent) => void;
  onRoundAdvanced?: (data: RoundAdvancedEvent) => void;
  onGamePaused?: (data: GamePausedEvent) => void;
  onGameResumed?: (data: GameResumedEvent) => void;
  onGameEnded?: (data: GameEndedEvent) => void;
  onPlayerLeft?: (data: PlayerLeftEvent) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onConnectError?: (error: Error) => void;
}

export function setupSocketHandlers(socket: Socket, callbacks: MultiplayerCallbacks): () => void {
  socket.on('connect', () => {
    callbacks.onConnect?.();
  });

  socket.on('disconnect', (reason: string) => {
    callbacks.onDisconnect?.(reason);
  });

  socket.on('connect_error', (error: Error) => {
    callbacks.onConnectError?.(error);
  });

  socket.on('player-joined', (data: PlayerJoinedEvent) => {
    callbacks.onPlayerJoined?.(data);
  });

  socket.on('game-started', (data: GameStartedEvent) => {
    callbacks.onGameStarted?.(data);
  });

  socket.on('player-submitted', (data: PlayerSubmittedEvent) => {
    callbacks.onPlayerSubmitted?.(data);
  });

  socket.on('round-advanced', (data: RoundAdvancedEvent) => {
    callbacks.onRoundAdvanced?.(data);
  });

  socket.on('game-paused', (data: GamePausedEvent) => {
    callbacks.onGamePaused?.(data);
  });

  socket.on('game-resumed', (data: GameResumedEvent) => {
    callbacks.onGameResumed?.(data);
  });

  socket.on('game-ended', (data: GameEndedEvent) => {
    callbacks.onGameEnded?.(data);
  });

  socket.on('player-left', (data: PlayerLeftEvent) => {
    callbacks.onPlayerLeft?.(data);
  });

  return () => {
    socket.off('connect');
    socket.off('disconnect');
    socket.off('connect_error');
    socket.off('player-joined');
    socket.off('game-started');
    socket.off('player-submitted');
    socket.off('round-advanced');
    socket.off('game-paused');
    socket.off('game-resumed');
    socket.off('game-ended');
    socket.off('player-left');
  };
}

export function getCurrentTwister(game: {
  twisters: Twister[];
  currentRound: number;
}): Twister | null {
  if (game.currentRound < 0) return null;
  return game.twisters[game.currentRound] ?? null;
}
