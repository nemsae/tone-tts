<script lang="ts">
  import type { Player } from '@/shared/config';
  import styles from './player-list.module.scss';

  interface Props {
    players: Player[];
    currentPlayerId: string | null;
  }

  let { players, currentPlayerId }: Props = $props();
</script>

<div class={styles.playerList}>
  {#each players as player (player.id)}
    <div class="{styles.playerItem} {player.id === currentPlayerId ? styles.currentPlayer : ''}">
      <div class={styles.playerIcon}>
        {#if player.isHost}
          <span class={styles.hostBadge}>H</span>
        {:else}
          <span class={styles.playerBadge}>P</span>
        {/if}
      </div>
      <div class={styles.playerName}>
        {player.name}
        {#if player.id === currentPlayerId}
          <span class={styles.youBadge}>(You)</span>
        {/if}
      </div>
      <div class={styles.playerStatus}>
        {#if player.isConnected}
          <span class={styles.connected}>Ready</span>
        {:else}
          <span class={styles.disconnected}>Disconnected</span>
        {/if}
      </div>
    </div>
  {/each}
</div>
