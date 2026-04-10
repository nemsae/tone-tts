export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type PeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed';

export interface PeerState {
  identityHex: string;
  name: string;
  connectionState: PeerConnectionState;
  isSpeaking: boolean;
  isMutedByLocal: boolean;
  isSelfMuted: boolean;
}

export interface VoiceChatState {
  connectionStatus: ConnectionStatus;
  isSelfMuted: boolean;
  peers: Map<string, PeerState>;
  speakingPeers: Set<string>;
  localIdentityHex: string | null;
  error: string | null;
}

export const VAD_THRESHOLD = 0.015;
export const VAD_SMOOTHING = 0.95;
export const RECONNECT_DELAY_MS = 2000;
export const ICE_SERVERS: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
