<script lang="ts">
  import type { GameState } from '@/shared/config';
  import { startGame } from '@/features/speech-scoring';
  import { multiplayerStore } from '@/shared/stores/multiplayer';
  import PlayerList from './PlayerList.svelte';
  import styles from './lobby.module.scss';

  interface Props {
    game: GameState;
    currentPlayerId: string;
    onLeave: () => void;
  }

  let { game, currentPlayerId, onLeave }: Props = $props();

  let isStarting = $state(false);

  const isHost = $derived(game.players.find((p) => p.id === currentPlayerId)?.isHost ?? false);
  const players = $derived(game.players);
  const error = $derived($multiplayerStore.connectionError);

  async function handleStartGame() {
    isStarting = true;
    multiplayerStore.clearError();
    await startGame();
    isStarting = false;
  }

  function handleLeave() {
    onLeave();
  }

  function getDifficultyLabel(length: string): string {
    const map: Record<string, string> = {
      short: 'Easy',
      medium: 'Medium',
      long: 'Hard',
      custom: 'Custom',
    };
    return map[length] || length;
  }
</script>

<div class={styles.lobby}>
  <div class={styles.header}>
    <h2>Game Lobby</h2>
    <div class={styles.roomCode}>{game.roomCode}</div>
    <div class={styles.settings}>
      <span>Topic: {game.settings.topic}</span>
      <span>Difficulty: {getDifficultyLabel(game.settings.length)}</span>
      <span>Rounds: {game.settings.rounds}</span>
    </div>
  </div>

  <div class={styles.playersSection}>
    <h3 class={styles.sectionTitle}>Players ({players.length}/4)</h3>
    <PlayerList {players} currentPlayerId={currentPlayerId} />
    {#if players.length < 2}
      <p class={styles.waiting}>Waiting for more players to join...</p>
    {/if}
  </div>

  {#if error}
    <div class={styles.error}>{error}</div>
  {/if}

  <div class={styles.actions}>
    {#if isHost}
      <button
        class={styles.startButton}
        onclick={handleStartGame}
        disabled={isStarting || players.length < 1}
      >
        {isStarting ? 'Starting...' : 'Start Game'}
      </button>
    {:else}
      <p class={styles.waiting}>Waiting for host to start...</p>
    {/if}
    <button class={styles.leaveButton} onclick={handleLeave}>Leave Room</button>
  </div>
</div>
