<script lang="ts">
  import type { GameState, Twister } from '@/shared/config';
  import { submitAnswer, pauseGame, resumeGame } from '@/features/speech-scoring';
  import { speechStore } from '@/shared/ui';
  import { createCountdown, type CountdownState } from '@/shared/time/countdown';
  import MultiplayerHud from './MultiplayerHud.svelte';
  import TwisterCard from '@/widgets/game-session/ui/TwisterCard.svelte';
  import styles from './multiplayer-session.module.scss';

  interface Props {
    game: GameState;
    currentTwister: Twister | null;
    roundStartTime: number;
    currentPlayerId: string;
    onLeave: () => void;
  }

  let { game, currentTwister, roundStartTime, currentPlayerId, onLeave }: Props = $props();

  let remainingTime = $state(30000);
  let hasSubmitted = $state(false);
  let myScore = $state<number | null>(null);
  let showPauseOverlay = $state(false);

  const isListening = $derived(speechStore.isListening);
  const transcript = $derived(speechStore.transcript);
  const startListening = speechStore.startListening;
  const stopListening = speechStore.stopListening;

  $effect(() => {
    if (!roundStartTime || game.status !== 'playing') return;

    const countdown = createCountdown(
      roundStartTime,
      (state: CountdownState) => {
        remainingTime = state.remaining;
      },
      () => {
        stopListening();
      }
    );

    return () => countdown.stop();
  });

  $effect(() => {
    if (game.status === 'paused') {
      showPauseOverlay = true;
      stopListening();
    } else if (game.status === 'playing') {
      showPauseOverlay = false;
    }
  });

  async function handleStartListening() {
    startListening();
  }

  function handleStopListening() {
    stopListening();
  }

  async function handleSubmit() {
    if (!transcript) return;

    const score = await submitAnswer(transcript);
    if (score !== null) {
      myScore = score;
      hasSubmitted = true;
    }
  }

  async function handlePause() {
    await pauseGame();
  }

  async function handleResume() {
    await resumeGame();
  }
</script>

<div class={styles.session}>
  <MultiplayerHud
    {remainingTime}
    currentRound={game.currentRound}
    totalRounds={game.settings.rounds}
    players={game.players}
    {currentPlayerId}
  />

  {#if currentTwister}
    <TwisterCard twister={currentTwister} settings={game.settings} />
  {:else}
    <div class={styles.waiting}>Waiting for twister...</div>
  {/if}

  <div class={styles.controls}>
    <div class="{styles.transcript} {isListening ? styles.listening : ''}">
      {transcript || (isListening ? 'Listening...' : 'Press the button and speak')}
    </div>

    <div class={styles.buttons}>
      {#if !isListening}
        <button class={styles.micButton} onclick={handleStartListening} disabled={hasSubmitted}>
          Start Speaking
        </button>
      {:else}
        <button class="{styles.micButton} {styles.listening}" onclick={handleStopListening}>
          Stop
        </button>
      {/if}

      {#if transcript && !hasSubmitted}
        <button class={styles.submitButton} onclick={handleSubmit}>Submit</button>
      {/if}
    </div>

    {#if myScore !== null}
      <div class="{styles.result} {myScore >= 80 ? styles.success : styles.failure}">
        {myScore >= 80 ? 'Great job!' : `Score: ${myScore}%`}
      </div>
    {/if}

    <button class={styles.leaveButton} onclick={handlePause}>Pause Game</button>
  </div>

  {#if showPauseOverlay}
    <div class={styles.pauseOverlay}>
      <h2 class={styles.pauseTitle}>Game Paused</h2>
      <p class={styles.pauseText}>Take a break!</p>
      <button class={styles.pauseButton} onclick={handleResume}>Resume Game</button>
      <button class={styles.leaveButton} onclick={onLeave}>Leave Game</button>
    </div>
  {/if}
</div>
