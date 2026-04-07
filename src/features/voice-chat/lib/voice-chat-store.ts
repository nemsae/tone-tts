import { writable } from 'svelte/store';
import type { VoiceChatState, PeerState, ConnectionStatus } from './types';

function createVoiceChatStore() {
  const { subscribe, set, update } = writable<VoiceChatState>({
    connectionStatus: 'disconnected',
    isSelfMuted: false,
    peers: new Map(),
    speakingPeers: new Set(),
    localIdentityHex: null,
    error: null,
  });

  return {
    subscribe,

    setConnectionStatus: (status: ConnectionStatus) =>
      update((s) => ({
        ...s,
        connectionStatus: status,
        error: status === 'error' ? s.error : null,
      })),

    setLocalIdentity: (identityHex: string) =>
      update((s) => ({ ...s, localIdentityHex: identityHex })),

    setSelfMuted: (isMuted: boolean) => update((s) => ({ ...s, isSelfMuted: isMuted })),

    setError: (error: string | null) =>
      update((s) => ({ ...s, error, connectionStatus: error ? 'error' : s.connectionStatus })),

    addPeer: (peer: PeerState) =>
      update((s) => {
        const peers = new Map(s.peers);
        peers.set(peer.identityHex, peer);
        return { ...s, peers };
      }),

    removePeer: (identityHex: string) =>
      update((s) => {
        const peers = new Map(s.peers);
        peers.delete(identityHex);
        const speakingPeers = new Set(s.speakingPeers);
        speakingPeers.delete(identityHex);
        return { ...s, peers, speakingPeers };
      }),

    updatePeer: (identityHex: string, updates: Partial<PeerState>) =>
      update((s) => {
        const peers = new Map(s.peers);
        const existing = peers.get(identityHex);
        if (existing) {
          peers.set(identityHex, { ...existing, ...updates });
        }
        return { ...s, peers };
      }),

    setPeerSpeaking: (identityHex: string, isSpeaking: boolean) =>
      update((s) => {
        const speakingPeers = new Set(s.speakingPeers);
        const peers = new Map(s.peers);
        if (isSpeaking) {
          speakingPeers.add(identityHex);
        } else {
          speakingPeers.delete(identityHex);
        }
        const existing = peers.get(identityHex);
        if (existing) {
          peers.set(identityHex, { ...existing, isSpeaking });
        }
        return { ...s, peers, speakingPeers };
      }),

    setPeerMutedByLocal: (identityHex: string, isMuted: boolean) =>
      update((s) => {
        const peers = new Map(s.peers);
        const existing = peers.get(identityHex);
        if (existing) {
          peers.set(identityHex, { ...existing, isMutedByLocal: isMuted });
        }
        return { ...s, peers };
      }),

    reset: () =>
      set({
        connectionStatus: 'disconnected',
        isSelfMuted: false,
        peers: new Map(),
        speakingPeers: new Set(),
        localIdentityHex: null,
        error: null,
      }),
  };
}

export const voiceChatStore = createVoiceChatStore();
