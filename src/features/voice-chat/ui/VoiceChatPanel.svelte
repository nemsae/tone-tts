<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { spacetimeDBProvider } from '@/shared/lib/spacetimedb-provider';
  import { WebRTCMeshManager } from '../lib/webrtc-mesh-manager';
  import { voiceChatStore } from '../lib/voice-chat-store';
  import styles from './voice-chat-panel.module.scss';

  interface Props {
    roomCode: string;
  }

  let { roomCode }: Props = $props();

  let meshManager: WebRTCMeshManager | null = $state(null);
  let initError: string | null = $state(null);

  const connectionStatus = $derived($voiceChatStore.connectionStatus);
  const isSelfMuted = $derived($voiceChatStore.isSelfMuted);
  const peers = $derived([...$voiceChatStore.peers.values()]);
  const localIdentityHex = $derived($voiceChatStore.localIdentityHex);
  const error = $derived($voiceChatStore.error || initError);

  onMount(async () => {
    try {
      meshManager = new WebRTCMeshManager(spacetimeDBProvider, roomCode);
      await meshManager.initialize();
    } catch (err) {
      initError = err instanceof Error ? err.message : 'Failed to initialize voice chat';
    }
  });

  onDestroy(() => {
    meshManager?.destroy();
    meshManager = null;
  });

  function toggleSelfMute() {
    if (!meshManager) return;
    meshManager.setMuted(!isSelfMuted);
  }

  function togglePeerMute(peerIdentityHex: string, currentlyMuted: boolean) {
    if (!meshManager || !spacetimeDBProvider.connection) return;
    // Find the identity object from SpacetimeDB
    for (const player of spacetimeDBProvider.connection.db.player.iter()) {
      if (player.identity.toHexString() === peerIdentityHex) {
        meshManager.setPeerMuted(peerIdentityHex, player.identity, !currentlyMuted);
        break;
      }
    }
  }

  function statusDotClass(status: string): string {
    if (status === 'connected') return `${styles.statusDot} ${styles.connected}`;
    if (status === 'connecting') return `${styles.statusDot} ${styles.connecting}`;
    if (status === 'error') return `${styles.statusDot} ${styles.error}`;
    return styles.statusDot;
  }
</script>

<div class={styles.panel}>
  <div class={styles.header}>
    <span class={styles.title}>
      <span class={statusDotClass(connectionStatus)}></span>
      Voice Chat
    </span>

    <div class={styles.controls}>
      <button
        class="{styles.muteBtn} {isSelfMuted ? styles.muted : ''}"
        onclick={toggleSelfMute}
        aria-label={isSelfMuted ? 'Unmute microphone' : 'Mute microphone'}
        disabled={connectionStatus !== 'connected'}
      >
        {#if isSelfMuted}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="1" y1="1" x2="23" y2="23" />
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.13 1.49-.36 2.18" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        {:else}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if error}
    <div class={styles.errorMsg}>{error}</div>
  {/if}

  <div class={styles.peerList}>
    {#if localIdentityHex}
      <div class="{styles.peerItem} {styles.localUser} {$voiceChatStore.speakingPeers.has(localIdentityHex) ? styles.speaking : ''}">
        <div class={styles.peerInfo}>
          <span class="{styles.speakingIndicator} {$voiceChatStore.speakingPeers.has(localIdentityHex) && !isSelfMuted ? styles.active : ''}"></span>
          <span class={styles.peerName}>
            You <span class={styles.youBadge}>{isSelfMuted ? '(muted)' : ''}</span>
          </span>
        </div>
      </div>
    {/if}

    {#each peers as peer (peer.identityHex)}
      <div class="{styles.peerItem} {peer.isSpeaking ? styles.speaking : ''}">
        <div class={styles.peerInfo}>
          <span class="{styles.speakingIndicator} {peer.isSpeaking && !peer.isMutedByLocal ? styles.active : ''}"></span>
          <span class={styles.peerName}>
            {peer.name}
            {#if peer.connectionState !== 'connected'}
              <span class={styles.peerStatus}>({peer.connectionState})</span>
            {/if}
          </span>
        </div>
        <button
          class="{styles.peerMuteBtn} {peer.isMutedByLocal ? styles.muted : ''}"
          onclick={() => togglePeerMute(peer.identityHex, peer.isMutedByLocal)}
          aria-label={peer.isMutedByLocal ? `Unmute ${peer.name}` : `Mute ${peer.name}`}
        >
          {#if peer.isMutedByLocal}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          {:else}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          {/if}
        </button>
      </div>
    {/each}
  </div>
</div>
