<script lang="ts">
  import type { Player } from '@/shared/config';
  import { formatCountdown } from '@/shared/time/countdown';
  import styles from './multiplayer-session.module.scss';

  interface Props {
    remainingTime: number;
    currentRound: number;
    totalRounds: number;
    players: Player[];
    currentPlayerId: string;
  }

  let { remainingTime, currentRound, totalRounds, players, currentPlayerId }: Props = $props();
</script>

<div class={styles.hud}>
  <div class={styles.timer}>{formatCountdown(remainingTime)}</div>
  <div class={styles.round}>
    <div class={styles.roundLabel}>Round</div>
    <div class={styles.roundValue}>{currentRound + 1} / {totalRounds}</div>
  </div>
</div>

<div class={styles.players}>
  {#each players as player (player.id)}
    <div class="{styles.playerScore} {player.id === currentPlayerId ? styles.isCurrent : ''}">
      <span class={styles.playerName}>
        {player.name}
        {#if player.id === currentPlayerId}
          (You)
        {/if}
      </span>
      <span class={styles.playerPoints}>
        {player.currentScore > 0 ? `${player.currentScore}%` : '-'}
      </span>
    </div>
  {/each}
</div>
