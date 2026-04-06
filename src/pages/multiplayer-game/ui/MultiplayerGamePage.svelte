<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount, onDestroy } from 'svelte';
  import { parseSubmitAnswerPayload, socketService, multiplayerGameStore } from '@/shared/lib';
  import { speechStore, Modal } from '@/shared/ui';
  import type {
    GameEndedEvent,
    GamePausedEvent,
    GameResumedEvent,
    GameScreen,
    GameSettings,
    GameStartedEvent,
    PlayerLeftEvent,
    PlayerSubmittedEvent,
    RoundAdvancedEvent,
    SocketActionAck,
    SubmitAnswerAck,
  } from '@/shared/lib/multiplayer-types';
  import styles from './multiplayer-game.module.scss';

  const DEFAULT_ROUND_DURATION_SECONDS = 30;
  const DEFAULT_AUTO_SUBMIT_DELAY_MS = 1500;
  const MS_PER_SECOND = 1000;
  const TIMER_INTERVAL_MS = 100;

  function getRoundDuration(settings: GameSettings | null | undefined): number {
    const roundTimeLimitSeconds = typeof settings?.roundTimeLimit === 'number'
      ? settings.roundTimeLimit
      : DEFAULT_ROUND_DURATION_SECONDS;
    return roundTimeLimitSeconds * MS_PER_SECOND;
  }

  function formatDifficulty(difficulty: number): string {
    if (difficulty === 1) {
      return 'Easy';
    }

    if (difficulty === 2) {
      return 'Medium';
    }

    return 'Hard';
  }

  let game = $derived($multiplayerGameStore.game);
  let roundStartTime = $derived($multiplayerGameStore.roundStartTime);
  let currentTwister = $derived($multiplayerGameStore.currentTwister);
  let players = $derived(game?.players ?? []);
  let gameStatus = $derived<GameScreen>(game?.status ?? 'playing');
  let isHost = $derived($multiplayerGameStore.player?.isHost ?? false);
  let currentPlayerId = $derived($multiplayerGameStore.player?.id ?? null);
  let autoSubmitEnabled = $derived(game?.settings?.autoSubmitEnabled ?? false);
  let autoSubmitDelay = $derived(game?.settings?.autoSubmitDelay ?? DEFAULT_AUTO_SUBMIT_DELAY_MS);

  let elapsedTime = $state(0);
  let remainingTime = $state(0);
  let error = $state('');
  let hasMicPermission = $state<boolean | null>(null);
  let showLeaveModal = $state(false);
  let hasSubmitted = $state(false);
  let mySimilarity = $state<number | null>(null);
  let gameStarted = $state(false);
  let totalPausedTime = $state(0);
  let pausedAt = $state<number | null>(null);

  let autoCheckTimer: ReturnType<typeof setTimeout> | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  let gameStartTime = $state<number | null>(null);

  const socket = socketService.connect();

  function handleGameStarted(data: GameStartedEvent) {
    hasSubmitted = false;
    mySimilarity = null;
    totalPausedTime = 0;
    pausedAt = null;
    gameStartTime = null;
    gameStarted = true;
    multiplayerGameStore.handleGameStarted(data);
    startGameTimer();
    speechStore.startListening();
  }

  function handlePlayerSubmitted(data: PlayerSubmittedEvent) {
    multiplayerGameStore.handlePlayerSubmitted(data);
  }

  function handleRoundAdvanced(data: RoundAdvancedEvent) {
    hasSubmitted = false;
    mySimilarity = null;
    multiplayerGameStore.handleRoundAdvanced(data);
    speechStore.stopListening();
    speechStore.clearTranscript(true);
  }

  function handleGamePaused(data: GamePausedEvent) {
    pausedAt = data.pausedAt;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    multiplayerGameStore.handleGamePaused(data);
    speechStore.stopListening();
  }

  function handleGameResumed(data: GameResumedEvent) {
    totalPausedTime = data.totalPausedTime;
    pausedAt = null;
    multiplayerGameStore.handleGameResumed(data);
    startGameTimer();
    speechStore.startListening();
  }

  function handleGameEnded(data: GameEndedEvent) {
    multiplayerGameStore.handleGameEnded(data);
    speechStore.stopListening();
    speechStore.clearTranscript();
    push('/multiplayer-result');
  }

  function handlePlayerLeft(data: PlayerLeftEvent) {
    multiplayerGameStore.handlePlayerLeft(data);
  }

  onMount(() => {
    if (game?.status === 'playing') {
      gameStarted = true;
      startGameTimer();
      speechStore.startListening();
    }

    socket.on('game-started', handleGameStarted);
    socket.on('player-submitted', handlePlayerSubmitted);
    socket.on('round-advanced', handleRoundAdvanced);
    socket.on('game-paused', handleGamePaused);
    socket.on('game-resumed', handleGameResumed);
    socket.on('game-ended', handleGameEnded);
    socket.on('player-left', handlePlayerLeft);

    void checkMicPermission();

    const handleBeforeUnload = () => {
      speechStore.clearTranscript();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  onDestroy(() => {
    if (autoCheckTimer) {
      clearTimeout(autoCheckTimer);
    }
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    socket.off('game-started', handleGameStarted);
    socket.off('player-submitted', handlePlayerSubmitted);
    socket.off('round-advanced', handleRoundAdvanced);
    socket.off('game-paused', handleGamePaused);
    socket.off('game-resumed', handleGameResumed);
    socket.off('game-ended', handleGameEnded);
    socket.off('player-left', handlePlayerLeft);
    speechStore.stopListening();
    speechStore.clearTranscript();
  });

  async function checkMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      hasMicPermission = true;
    } catch {
      hasMicPermission = false;
    }
  }

  function startGameTimer() {
    if (!gameStartTime) {
      gameStartTime = Date.now();
    }
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    remainingTime = getRemainingTime();
    timerInterval = setInterval(() => {
      if (gameStartTime) {
        elapsedTime = Date.now() - gameStartTime - totalPausedTime;
      }
      remainingTime = getRemainingTime();
    }, TIMER_INTERVAL_MS);
  }

  function handleSubmit() {
    if (!$speechStore.transcript || hasSubmitted) {
      return;
    }

    let payload;
    try {
      payload = parseSubmitAnswerPayload({
        transcript: $speechStore.transcript,
        timestamp: Date.now(),
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Invalid transcript';
      return;
    }

    socket.emit('submit-answer', payload, (response: SubmitAnswerAck) => {
      if (response.success) {
        hasSubmitted = true;
        mySimilarity = response.similarity;
      } else {
        error = response.error || 'Failed to submit answer';
      }
    });
  }

  function handlePause() {
    socket.emit('pause-game', {}, (response: SocketActionAck) => {
      if (!response.success) {
        error = response.error || 'Failed to pause';
      }
    });
  }

  function handleResume() {
    socket.emit('resume-game', {}, (response: SocketActionAck) => {
      if (!response.success) {
        error = response.error || 'Failed to resume';
      }
    });
  }

  function confirmLeave() {
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
    const roundDuration = getRoundDuration(game?.settings);
    if (!roundStartTime) {
      return roundDuration;
    }
    const now = pausedAt ?? Date.now();
    return Math.max(0, roundDuration - (now - roundStartTime - totalPausedTime));
  }

  $effect(() => {
    if (autoCheckTimer) {
      clearTimeout(autoCheckTimer);
      autoCheckTimer = null;
    }

    if ($speechStore.isListening && $speechStore.transcript && !hasSubmitted && autoSubmitEnabled) {
      autoCheckTimer = setTimeout(() => {
        handleSubmit();
      }, autoSubmitDelay);
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
        <button class={styles.leaveButton} onclick={() => showLeaveModal = true}>Leave Game</button>
        <div class={styles.timer}>
          <span class={styles.timerLabel}>Total Time</span>
          <span class={styles.timerValue}>{formatTime(elapsedTime)}</span>
        </div>
        {#if isHost}
          <button class={styles.pauseButton} onclick={handlePause}>Pause</button>
        {/if}
      </div>

      <div class={styles.playersRow}>
        {#each players as player (player.id)}
          <div class="{styles.playerCard} {player.id === currentPlayerId ? styles.myCard : ''}">
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
              <span class={styles.twisterDifficulty}>{formatDifficulty(currentTwister.difficulty)}</span>
            </div>
            <div class={styles.twisterText}>{currentTwister.text}</div>
          </div>

          <div class={styles.countdown}>
            <span class={styles.countdownLabel}>Time Left</span>
            <span class={styles.countdownValue}>{Math.ceil(remainingTime / 1000)}s</span>
          </div>
        </div>
      {/if}

      <div class={styles.controls}>
        <div class={styles.transcript}>
          {$speechStore.transcript || ($speechStore.isListening ? 'Listening...' : 'Press the button and speak')}
        </div>

        {#if $speechStore.error}
          <div class={styles.error}>{$speechStore.error}</div>
        {/if}

        {#if hasSubmitted}
          <div class={styles.submittedMessage}>
            Submitted! Score: {mySimilarity}%
          </div>
        {:else}
          <div class={styles.buttons}>
            {#if !$speechStore.isListening}
              <button class={styles.micButton} onclick={() => speechStore.startListening()}>
                Start Speaking
              </button>
            {:else}
              <button class="{styles.micButton} {styles.listening}" onclick={() => speechStore.stopListening()}>
                Stop
              </button>
              {#if !autoSubmitEnabled && $speechStore.transcript}
                <button class={styles.submitButton} onclick={handleSubmit}>
                  Submit Answer
                </button>
              {/if}

              {#if $speechStore.transcript}
                <button class={styles.resetButton} onclick={() => speechStore.clearTranscript(true)}>
                  Reset
                </button>
              {/if}
            {/if}
          </div>
        {/if}

        {#if error}
          <div class={styles.error}>{error}</div>
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
    isOpen={showLeaveModal}
    onClose={() => showLeaveModal = false}
    title="Leave Game?"
    confirmLabel="Leave"
    cancelLabel="Stay"
    onConfirm={confirmLeave}
    confirmVariant="danger"
  >
    <p>Are you sure you want to leave the game?</p>
  </Modal>
</div>
