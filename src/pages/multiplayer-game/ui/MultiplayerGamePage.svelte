<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount, onDestroy } from 'svelte';
  import { socketService, multiplayerGameStore } from '@/shared/lib';
  import { speechStore, Modal } from '@/shared/ui';
  import type { Twister, Player, LeaderboardEntry } from '@/shared/lib/multiplayer-types';
  import styles from './multiplayer-game.module.scss';

  const ROUND_DURATION = 30000;

  let elapsedTime = $state(0);
  let roundStartTime = $state<number | null>(null);
  let currentTwister = $state<Twister | null>(null);
  let players = $state<Player[]>([]);
  let gameStatus = $state<'lobby' | 'playing' | 'paused' | 'game-over'>('playing');
  let isHost = $state(false);
  let error = $state('');
  let hasMicPermission = $state<boolean | null>(null);
  let showSkipModal = $state(false);
  let hasSubmitted = $state(false);
  let mySimilarity = $state<number | null>(null);
  let leaderboard = $state<LeaderboardEntry[]>([]);
  let gameStarted = $state(false);

  const socket = socketService.connect();

  const isListening = $derived(speechStore.isListening);
  const transcript = $derived(speechStore.transcript);
  const startListening = speechStore.startListening;
  const stopListening = speechStore.stopListening;
  const clearTranscript = speechStore.clearTranscript;

  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let gameStartTime = $state<number | null>(null);

  onMount(() => {
    const store = $multiplayerGameStore;
    currentTwister = store.currentTwister;
    roundStartTime = store.roundStartTime;
    players = store.game?.players ?? [];
    gameStatus = store.game?.status ?? 'playing';
    isHost = store.player?.isHost ?? false;

    if (store.game?.status === 'playing') {
      gameStarted = true;
      startGameTimer();
      startListening();
    }

    socket.on('game-started', (data: { game: any; currentTwister: Twister; roundStartTime: number }) => {
      currentTwister = data.currentTwister;
      roundStartTime = data.roundStartTime;
      gameStatus = 'playing';
      gameStarted = true;
      multiplayerGameStore.handleGameStarted(data);
      startGameTimer();
      startListening();
    });

    socket.on('player-submitted', (data: { playerId: string; similarity: number }) => {
      multiplayerGameStore.handlePlayerSubmitted(data);
      players = $multiplayerGameStore.game?.players ?? [];
    });

    socket.on('round-advanced', (data: { currentRound: number; currentTwister: Twister; roundStartTime: number }) => {
      currentTwister = data.currentTwister;
      roundStartTime = data.roundStartTime;
      hasSubmitted = false;
      mySimilarity = null;
      multiplayerGameStore.handleRoundAdvanced(data);
      clearTranscript();
      if (isListening) {
        stopListening();
      }
      startListening();
    });

    socket.on('game-paused', (data: { pausedAt: number; pausedBy: string }) => {
      gameStatus = 'paused';
      multiplayerGameStore.handleGamePaused(data);
      stopListening();
    });

    socket.on('game-resumed', (data: { resumedAt: number; totalPausedTime: number }) => {
      gameStatus = 'playing';
      multiplayerGameStore.handleGameResumed(data);
      startListening();
    });

    socket.on('game-ended', (data: { leaderboard: LeaderboardEntry[] }) => {
      gameStatus = 'game-over';
      leaderboard = data.leaderboard;
      multiplayerGameStore.handleGameEnded(data);
      stopListening();
      push('/multiplayer-result');
    });

    socket.on('player-left', (data: { playerId: string; players: Player[] }) => {
      players = data.players;
      multiplayerGameStore.handlePlayerLeft(data);
    });

    checkMicPermission();
  });

  onDestroy(() => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    socket.off('game-started');
    socket.off('player-submitted');
    socket.off('round-advanced');
    socket.off('game-paused');
    socket.off('game-resumed');
    socket.off('game-ended');
    socket.off('player-left');
    stopListening();
  });

  function checkMicPermission() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((track) => track.stop());
        hasMicPermission = true;
      })
      .catch(() => {
        hasMicPermission = false;
      });
  }

  function startGameTimer() {
    gameStartTime = Date.now();
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    timerInterval = setInterval(() => {
      if (gameStartTime) {
        elapsedTime = Date.now() - gameStartTime;
      }
    }, 100);
  }

  function handleSubmit() {
    if (!transcript || hasSubmitted) return;

    socket.emit('submit-answer', {
      transcript,
      timestamp: Date.now()
    }, (response: any) => {
      if (response.success) {
        hasSubmitted = true;
        mySimilarity = response.similarity;
      } else {
        error = response.error || 'Failed to submit answer';
      }
    });
  }

  function handlePause() {
    socket.emit('pause-game', {}, (response: any) => {
      if (!response.success) {
        error = response.error || 'Failed to pause';
      }
    });
  }

  function handleResume() {
    socket.emit('resume-game', {}, (response: any) => {
      if (!response.success) {
        error = response.error || 'Failed to resume';
      }
    });
  }

  function handleLeave() {
    socketService.disconnect();
    multiplayerGameStore.reset();
    push('/');
  }

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function getRemainingTime(): number {
    if (!roundStartTime) return ROUND_DURATION;
    return Math.max(0, ROUND_DURATION - (Date.now() - roundStartTime));
  }

  $effect(() => {
    if (gameStatus === 'playing' && !hasSubmitted && transcript && isListening) {
      const similarity = Math.random() * 30 + 70;
      if (similarity > 80) {
        handleSubmit();
      }
    }
  });
</script>

<div class={styles.page}>
  {#if !gameStarted}
    <div class={styles.loading}>Waiting for game to start...</div>
  {:else if gameStatus === 'paused'}
    <Modal
      isOpen={true}
      onClose={() => {}}
      title="Game Paused"
      confirmLabel="Resume Game"
      cancelLabel=""
      onConfirm={handleResume}
    >
      <p>Take a break! The host will resume when everyone's ready.</p>
    </Modal>
  {:else}
    <div class={styles.gameContainer}>
      <div class={styles.header}>
        <button class={styles.leaveButton} onclick={handleLeave}>Leave Game</button>
        <div class={styles.timer}>
          <span class={styles.timerLabel}>Total Time</span>
          <span class={styles.timerValue}>{formatTime(elapsedTime)}</span>
        </div>
        {#if isHost}
          <button class={styles.pauseButton} onclick={handlePause}>Pause</button>
        {/if}
      </div>

      <div class={styles.playersRow}>
        {#each players as player}
          <div class="{styles.playerCard} {player.id === $multiplayerGameStore.player?.id ? styles.myCard : ''}">
            <span class={styles.playerName}>{player.name}</span>
            <span class={styles.playerScore}>
              {player.currentScore > 0 ? `${player.currentScore}%` : '-'}
            </span>
          </div>
        {/each}
      </div>

      {#if currentTwister}
        <div class={styles.twisterSection}>
          <div class={styles.twisterCard}>
            <div class={styles.twisterHeader}>
              <span class={styles.twisterTopic}>{currentTwister.topic}</span>
              <span class={styles.twisterDifficulty}>
                {currentTwister.difficulty === 1 ? 'Easy' : currentTwister.difficulty === 2 ? 'Medium' : 'Hard'}
              </span>
            </div>
            <div class={styles.twisterText}>{currentTwister.text}</div>
          </div>

          <div class={styles.countdown}>
            <span class={styles.countdownLabel}>Time Left</span>
            <span class={styles.countdownValue}>{Math.ceil(getRemainingTime() / 1000)}s</span>
          </div>
        </div>
      {/if}

      <div class={styles.controls}>
        <div class={styles.transcript}>
          {transcript || (isListening ? 'Listening...' : 'Press the button and speak')}
        </div>

        {#if error}
          <div class={styles.error}>{error}</div>
        {/if}

        {#if hasSubmitted}
          <div class={styles.submittedMessage}>
            Submitted! Score: {mySimilarity}%
          </div>
        {:else}
          <div class={styles.buttons}>
            {#if !isListening}
              <button class={styles.micButton} onclick={startListening}>
                Start Speaking
              </button>
            {:else}
              <button class="{styles.micButton} {styles.listening}" onclick={stopListening}>
                Stop
              </button>
              <button class={styles.submitButton} onclick={handleSubmit} disabled={!transcript}>
                Submit Answer
              </button>
            {/if}
          </div>
        {/if}

        {#if hasMicPermission === false}
          <div class={styles.error}>
            Microphone access is required. Please enable it in your browser settings.
          </div>
        {/if}
      </div>
    </div>
  {/if}

  <Modal
    isOpen={showSkipModal}
    onClose={() => showSkipModal = false}
    title="Leave Game?"
    confirmLabel="Leave"
    cancelLabel="Stay"
    onConfirm={handleLeave}
    confirmVariant="danger"
  >
    <p>Are you sure you want to leave the game?</p>
  </Modal>
</div>
