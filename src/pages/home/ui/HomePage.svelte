<script lang="ts">
  import { push } from 'svelte-spa-router';
  import styles from './home.module.scss';

  function handleSolo() {
    push('/solo');
  }

  function handleMultiplayer() {
    push('/multiplayer');
  }
</script>

<div class={styles.page}>
  <div class={styles.container}>
    <h1 class={styles.title}>Tongue Twister Challenge</h1>
    <p class={styles.subtitle}>Test your pronunciation skills!</p>

    <div class={styles.modeGrid}>
      <button class={styles.modeButton} onclick={handleSolo}>
        <span class={styles.modeIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
          </svg>
        </span>
        <span class={styles.modeLabel}>Solo Play</span>
        <span class={styles.modeDescription}>Practice on your own</span>
      </button>

      <button class={styles.modeButton} onclick={handleMultiplayer}>
        <span class={styles.modeIcon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="8" cy="6" r="3" />
            <circle cx="16" cy="6" r="3" />
            <path d="M2 20c0-3 3-5 6-5" />
            <path d="M12 20c0-3 3-5 6-5" />
            <path d="M8 10l4-2 4 2" />
          </svg>
        </span>
        <span class={styles.modeLabel}>Multiplayer</span>
        <span class={styles.modeDescription}>Challenge friends (2-4 players)</span>
      </button>
    </div>
  </div>
</div>
