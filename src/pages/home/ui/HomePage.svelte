<script lang="ts">
  import { onMount } from 'svelte';
  import { push } from 'svelte-spa-router';
  import { getActiveLobbyPlayerCount } from '@/shared/api';
  import styles from './home.module.scss';

  const LOBBY_COUNT_REFRESH_INTERVAL_MS = 30_000;
  const numberFormatter = new Intl.NumberFormat('en-US');

  let activeLobbyPlayerCount = $state(0);
  let visibleLobbyAvatars = $derived(
    Array.from({ length: Math.min(activeLobbyPlayerCount, 3) }, (_, index) => index)
  );

  function handleSolo() {
    push('/solo-setup');
  }

  function handleMultiplayerLounge() {
    push('/multiplayer-mode');
  }

  function handleCreateRoom() {
    push('/multiplayer-setup');
  }

  function handleJoinRoom() {
    push('/multiplayer-join');
  }

  async function loadActiveLobbyPlayerCount() {
    try {
      activeLobbyPlayerCount = await getActiveLobbyPlayerCount();
    } catch {
      activeLobbyPlayerCount = 0;
    }
  }

  onMount(() => {
    void loadActiveLobbyPlayerCount();

    const refreshTimer = window.setInterval(() => {
      void loadActiveLobbyPlayerCount();
    }, LOBBY_COUNT_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(refreshTimer);
    };
  });
</script>

<div class={styles.page}>
  <div class={styles.header}>
    <div class={styles.headerSpacer}></div>
    <div class={styles.headerActions}>
      <button type="button" class={styles.iconButton} aria-label="Settings">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <button type="button" class={styles.iconButton} aria-label="Help">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    </div>
  </div>

  <div class={styles.container}>
    <h1 class={styles.title}>Twist & Shout</h1>
    <p class={styles.subtitle}>
      <span class={styles.highlight}>ready to play.</span>
      <br />
      Experience the rhythm of connection. Choose your mode and dive into the symphony of Twist & Shout.
    </p>

    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>Premium Experience</h2>
      <p class={styles.sectionSubtitle}>multiplayer lounge</p>

      <div class={styles.loungeCard}>
        <div class={styles.loungeCardContent}>
          <div class={styles.loungeIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div class={styles.quickActions}>
            <button type="button" class="{styles.quickAction} {styles.primaryQuickAction}" onclick={handleMultiplayerLounge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M8 5v14l11-7z" />
              </svg>
              open lounge
            </button>
            <button type="button" class={styles.quickAction} onclick={handleCreateRoom}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              create a room
            </button>
            <button type="button" class={styles.quickAction} onclick={handleJoinRoom}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              join a room
            </button>
          </div>
        </div>
        <div class={styles.lobbyInfo}>
          <span class={styles.avatarStack}>
            {#each visibleLobbyAvatars as avatarIndex (avatarIndex)}
              <span class={styles.avatar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
            {/each}
            {#if activeLobbyPlayerCount > 3}
              <span class={styles.plusAvatar}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </span>
            {/if}
          </span>
          <span class={styles.playerCount}>
            {numberFormatter.format(activeLobbyPlayerCount)} players active in the lobby right now.
          </span>
        </div>
      </div>
    </div>

    <div class={styles.section}>
      <h2 class={styles.sectionTitle}>single player</h2>
      <p class={styles.sectionDescription}>
        Sharpen your skills or enjoy a peaceful solo session. Your personal records await.
      </p>

      <div class={styles.soloCard}>
        <div class={styles.soloFeatures}>
          <div class={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            practice mode
          </div>
          <div class={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            achievements
          </div>
          <div class={styles.featureItem}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            recent scores
          </div>
        </div>
        <button type="button" class={styles.soloButton} onclick={handleSolo}>
          <span>start solo game</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>
