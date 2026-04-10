import type { Identity } from 'spacetimedb';
import type { SpacetimeDBProvider, STDBPeerSignal, STDBPlayer } from '@/shared/lib';
import { AudioPipeline } from './audio-pipeline';
import { voiceChatStore } from './voice-chat-store';
import { ICE_SERVERS, RECONNECT_DELAY_MS } from './types';

const RTC_CONFIG: RTCConfiguration = { iceServers: ICE_SERVERS };

export class WebRTCMeshManager {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidate[]> = new Map();
  private audioPipeline: AudioPipeline;
  private provider: SpacetimeDBProvider;
  private roomCode: string;
  private localIdentityHex: string | null = null;
  private unsubscribers: Array<() => void> = [];
  private reconnectTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private destroyed = false;

  constructor(provider: SpacetimeDBProvider, roomCode: string) {
    this.provider = provider;
    this.roomCode = roomCode;
    this.audioPipeline = new AudioPipeline();
  }

  async initialize(): Promise<void> {
    const identity = this.provider.getIdentity();
    if (!identity) throw new Error('Not connected to SpacetimeDB');

    this.localIdentityHex = identity.toHexString();
    voiceChatStore.setLocalIdentity(this.localIdentityHex);
    voiceChatStore.setConnectionStatus('connecting');

    try {
      await this.audioPipeline.captureLocalAudio();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Microphone access denied';
      voiceChatStore.setError(message);
      throw err;
    }

    this.audioPipeline.onLocalSpeakingChange((isSpeaking) => {
      if (this.localIdentityHex) {
        voiceChatStore.setPeerSpeaking(this.localIdentityHex, isSpeaking);
      }
    });

    this.audioPipeline.onSpeakingStateChange((peerHex, isSpeaking) => {
      voiceChatStore.setPeerSpeaking(peerHex, isSpeaking);
    });

    this.setupProviderListeners();

    // Connect to all existing peers in the room
    const players = this.provider.getPlayersInRoom(this.roomCode);
    for (const player of players) {
      const peerHex = player.identity.toHexString();
      if (peerHex !== this.localIdentityHex) {
        voiceChatStore.addPeer({
          identityHex: peerHex,
          name: player.name,
          connectionState: 'new',
          isSpeaking: false,
          isMutedByLocal: false,
          isSelfMuted: false,
        });
        await this.connectToPeer(player.identity);
      }
    }

    voiceChatStore.setConnectionStatus('connected');
  }

  private setupProviderListeners(): void {
    const unsub1 = this.provider.onPlayerJoin((player: STDBPlayer) => {
      const peerHex = player.identity.toHexString();
      if (peerHex === this.localIdentityHex) return;
      if (player.roomCode !== this.roomCode) return;

      voiceChatStore.addPeer({
        identityHex: peerHex,
        name: player.name,
        connectionState: 'new',
        isSpeaking: false,
        isMutedByLocal: false,
        isSelfMuted: false,
      });
      // New player creates offers to existing players,
      // but we also initiate from our side if we have a lower identity hex
      // to avoid race conditions. The "polite peer" pattern:
      // the peer with the lower identity hex is the "impolite" peer that always creates offers.
      if (this.localIdentityHex && this.localIdentityHex < peerHex) {
        void this.connectToPeer(player.identity);
      }
    });

    const unsub2 = this.provider.onPlayerLeave((player: STDBPlayer) => {
      const peerHex = player.identity.toHexString();
      void this.disconnectFromPeer(peerHex);
    });

    const unsub3 = this.provider.onPlayerUpdate((_oldPlayer: STDBPlayer, newPlayer: STDBPlayer) => {
      const peerHex = newPlayer.identity.toHexString();
      if (peerHex === this.localIdentityHex) return;
      if (!newPlayer.isOnline && this.peerConnections.has(peerHex)) {
        void this.disconnectFromPeer(peerHex);
      }
    });

    const unsub4 = this.provider.onSignalReceived((signal: STDBPeerSignal) => {
      void this.handleSignal(signal);
    });

    const unsub5 = this.provider.onMuteStateChanged((mute) => {
      if (!this.localIdentityHex) return;
      const muterHex = mute.muterIdentity.toHexString();
      const mutedHex = mute.mutedIdentity.toHexString();

      // If someone muted/unmuted us from their side, update our peer's selfMuted state
      if (mutedHex === this.localIdentityHex) {
        voiceChatStore.updatePeer(muterHex, { isMutedByLocal: false });
      }
      // If we muted someone, this is already handled locally
      if (muterHex === this.localIdentityHex) {
        voiceChatStore.setPeerMutedByLocal(mutedHex, mute.isMuted);
        this.audioPipeline.setPeerMuted(mutedHex, mute.isMuted);
      }
    });

    this.unsubscribers.push(unsub1, unsub2, unsub3, unsub4, unsub5);
  }

  async connectToPeer(peerIdentity: Identity): Promise<void> {
    const peerHex = peerIdentity.toHexString();
    if (this.destroyed || this.peerConnections.has(peerHex)) return;

    voiceChatStore.updatePeer(peerHex, { connectionState: 'connecting' });

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(peerHex, pc);
    this.pendingCandidates.set(peerHex, []);

    // Add local tracks
    const localStream = this.audioPipeline.getLocalStream();
    if (localStream) {
      for (const track of localStream.getAudioTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.audioPipeline.attachRemoteStream(peerHex, event.streams[0]);
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.provider.sendSignal(
          peerIdentity,
          'ice-candidate',
          JSON.stringify(event.candidate.toJSON())
        );
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          voiceChatStore.updatePeer(peerHex, { connectionState: 'connected' });
          break;
        case 'disconnected':
          voiceChatStore.updatePeer(peerHex, { connectionState: 'disconnected' });
          break;
        case 'failed':
          voiceChatStore.updatePeer(peerHex, { connectionState: 'failed' });
          this.scheduleReconnect(peerIdentity);
          break;
        case 'closed':
          voiceChatStore.updatePeer(peerHex, { connectionState: 'disconnected' });
          break;
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    this.provider.sendSignal(peerIdentity, 'offer', JSON.stringify(offer));
  }

  async disconnectFromPeer(peerIdentityHex: string): Promise<void> {
    const timer = this.reconnectTimers.get(peerIdentityHex);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(peerIdentityHex);
    }

    const pc = this.peerConnections.get(peerIdentityHex);
    if (pc) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      this.peerConnections.delete(peerIdentityHex);
    }

    this.pendingCandidates.delete(peerIdentityHex);
    this.audioPipeline.removeRemoteStream(peerIdentityHex);
    voiceChatStore.removePeer(peerIdentityHex);
  }

  async handleSignal(signal: STDBPeerSignal): Promise<void> {
    const fromHex = signal.fromIdentity.toHexString();

    if (signal.signalType === 'offer') {
      await this.handleOffer(signal.fromIdentity, fromHex, signal.signalData);
    } else if (signal.signalType === 'answer') {
      await this.handleAnswer(fromHex, signal.signalData);
    } else if (signal.signalType === 'ice-candidate') {
      await this.handleIceCandidate(fromHex, signal.signalData);
    }
  }

  private async handleOffer(
    fromIdentity: Identity,
    fromHex: string,
    sdpJson: string
  ): Promise<void> {
    // If we already have a connection and our identity is lower (we're "impolite"),
    // ignore the incoming offer - our own offer takes precedence
    if (
      this.peerConnections.has(fromHex) &&
      this.localIdentityHex &&
      this.localIdentityHex < fromHex
    ) {
      return;
    }

    // Close existing connection if any
    if (this.peerConnections.has(fromHex)) {
      const existing = this.peerConnections.get(fromHex)!;
      existing.close();
      this.peerConnections.delete(fromHex);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    this.peerConnections.set(fromHex, pc);
    this.pendingCandidates.set(fromHex, []);

    voiceChatStore.updatePeer(fromHex, { connectionState: 'connecting' });

    const localStream = this.audioPipeline.getLocalStream();
    if (localStream) {
      for (const track of localStream.getAudioTracks()) {
        pc.addTrack(track, localStream);
      }
    }

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.audioPipeline.attachRemoteStream(fromHex, event.streams[0]);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.provider.sendSignal(
          fromIdentity,
          'ice-candidate',
          JSON.stringify(event.candidate.toJSON())
        );
      }
    };

    pc.onconnectionstatechange = () => {
      switch (pc.connectionState) {
        case 'connected':
          voiceChatStore.updatePeer(fromHex, { connectionState: 'connected' });
          break;
        case 'disconnected':
          voiceChatStore.updatePeer(fromHex, { connectionState: 'disconnected' });
          break;
        case 'failed':
          voiceChatStore.updatePeer(fromHex, { connectionState: 'failed' });
          this.scheduleReconnect(fromIdentity);
          break;
        case 'closed':
          voiceChatStore.updatePeer(fromHex, { connectionState: 'disconnected' });
          break;
      }
    };

    const offer = JSON.parse(sdpJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(offer));

    // Apply any pending ICE candidates
    const pending = this.pendingCandidates.get(fromHex) ?? [];
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate);
    }
    this.pendingCandidates.set(fromHex, []);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    this.provider.sendSignal(fromIdentity, 'answer', JSON.stringify(answer));
  }

  private async handleAnswer(fromHex: string, sdpJson: string): Promise<void> {
    const pc = this.peerConnections.get(fromHex);
    if (!pc) return;

    const answer = JSON.parse(sdpJson) as RTCSessionDescriptionInit;
    await pc.setRemoteDescription(new RTCSessionDescription(answer));

    // Apply any pending ICE candidates
    const pending = this.pendingCandidates.get(fromHex) ?? [];
    for (const candidate of pending) {
      await pc.addIceCandidate(candidate);
    }
    this.pendingCandidates.set(fromHex, []);
  }

  private async handleIceCandidate(fromHex: string, candidateJson: string): Promise<void> {
    const pc = this.peerConnections.get(fromHex);
    const candidate = new RTCIceCandidate(JSON.parse(candidateJson) as RTCIceCandidateInit);

    if (!pc || !pc.remoteDescription) {
      // Queue the candidate until we have a remote description
      const pending = this.pendingCandidates.get(fromHex) ?? [];
      pending.push(candidate);
      this.pendingCandidates.set(fromHex, pending);
      return;
    }

    await pc.addIceCandidate(candidate);
  }

  private scheduleReconnect(peerIdentity: Identity): void {
    const peerHex = peerIdentity.toHexString();
    if (this.destroyed) return;

    const existingTimer = this.reconnectTimers.get(peerHex);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.reconnectTimers.delete(peerHex);
      if (this.destroyed) return;

      // Close old connection
      const oldPc = this.peerConnections.get(peerHex);
      if (oldPc) {
        oldPc.ontrack = null;
        oldPc.onicecandidate = null;
        oldPc.onconnectionstatechange = null;
        oldPc.close();
        this.peerConnections.delete(peerHex);
      }

      void this.connectToPeer(peerIdentity);
    }, RECONNECT_DELAY_MS);

    this.reconnectTimers.set(peerHex, timer);
  }

  setMuted(isMuted: boolean): void {
    this.audioPipeline.setMuted(isMuted);
    voiceChatStore.setSelfMuted(isMuted);
  }

  setPeerMuted(peerIdentityHex: string, peerIdentity: Identity, isMuted: boolean): void {
    this.audioPipeline.setPeerMuted(peerIdentityHex, isMuted);
    voiceChatStore.setPeerMutedByLocal(peerIdentityHex, isMuted);
    this.provider.setMute(peerIdentity, isMuted);
  }

  destroy(): void {
    this.destroyed = true;

    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];

    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    for (const [peerHex, pc] of this.peerConnections) {
      pc.ontrack = null;
      pc.onicecandidate = null;
      pc.onconnectionstatechange = null;
      pc.close();
      this.audioPipeline.removeRemoteStream(peerHex);
    }
    this.peerConnections.clear();
    this.pendingCandidates.clear();

    this.audioPipeline.destroy();
    voiceChatStore.reset();
  }
}
