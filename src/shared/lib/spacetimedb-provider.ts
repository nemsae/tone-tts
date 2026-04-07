import { type Identity } from 'spacetimedb';
import { DbConnection, type EventContext, type ErrorContext } from './spacetimedb-bindings/index';
import type { PeerSignal } from './spacetimedb-bindings/types';
import type { MuteState } from './spacetimedb-bindings/types';
import type { Player } from './spacetimedb-bindings/types';

const STDB_TOKEN_KEY = 'spacetimedb_auth_token';

type PlayerCallback = (player: Player) => void;
type SignalCallback = (signal: PeerSignal) => void;
type MuteCallback = (mute: MuteState) => void;
type ConnectionCallback = (identity: Identity) => void;
type ErrorCallback = (error: Error) => void;

export class SpacetimeDBProvider {
  connection: DbConnection | null = null;
  private identity: Identity | null = null;

  private onConnectCallbacks: ConnectionCallback[] = [];
  private onDisconnectCallbacks: Array<() => void> = [];
  private onPlayerJoinCallbacks: PlayerCallback[] = [];
  private onPlayerLeaveCallbacks: PlayerCallback[] = [];
  private onPlayerUpdateCallbacks: Array<(oldPlayer: Player, newPlayer: Player) => void> = [];
  private onSignalReceivedCallbacks: SignalCallback[] = [];
  private onMuteStateChangedCallbacks: MuteCallback[] = [];
  private onErrorCallbacks: ErrorCallback[] = [];

  connect(moduleHost?: string, moduleName?: string): void {
    const host = moduleHost || import.meta.env.VITE_SPACETIMEDB_HOST || 'ws://localhost:3000';
    const dbName = moduleName || import.meta.env.VITE_SPACETIMEDB_MODULE || 'tone-tts';
    const savedToken = localStorage.getItem(STDB_TOKEN_KEY) || undefined;

    this.connection = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(dbName)
      .withToken(savedToken)
      .onConnect((conn: DbConnection, identity: Identity, token: string) => {
        this.identity = identity;
        localStorage.setItem(STDB_TOKEN_KEY, token);
        this.onConnectCallbacks.forEach((cb) => cb(identity));

        this.setupTableCallbacks(conn);
      })
      .onDisconnect(() => {
        this.onDisconnectCallbacks.forEach((cb) => cb());
      })
      .onConnectError((ctx: ErrorContext) => {
        const err = ctx.event instanceof Error ? ctx.event : new Error('Connection error');
        this.onErrorCallbacks.forEach((cb) => cb(err));
      })
      .build();
  }

  private setupTableCallbacks(conn: DbConnection): void {
    conn.db.player.onInsert((_ctx: EventContext, player: Player) => {
      if (!this.identity || !player.identity.isEqual(this.identity)) {
        this.onPlayerJoinCallbacks.forEach((cb) => cb(player));
      }
    });

    conn.db.player.onDelete((_ctx: EventContext, player: Player) => {
      this.onPlayerLeaveCallbacks.forEach((cb) => cb(player));
    });

    conn.db.player.onUpdate((_ctx: EventContext, oldPlayer: Player, newPlayer: Player) => {
      this.onPlayerUpdateCallbacks.forEach((cb) => cb(oldPlayer, newPlayer));
    });

    conn.db.peer_signal.onInsert((_ctx: EventContext, signal: PeerSignal) => {
      if (this.identity && signal.toIdentity.isEqual(this.identity)) {
        this.onSignalReceivedCallbacks.forEach((cb) => cb(signal));
      }
    });

    conn.db.mute_state.onInsert((_ctx: EventContext, mute: MuteState) => {
      this.onMuteStateChangedCallbacks.forEach((cb) => cb(mute));
    });

    conn.db.mute_state.onUpdate((_ctx: EventContext, _oldMute: MuteState, newMute: MuteState) => {
      this.onMuteStateChangedCallbacks.forEach((cb) => cb(newMute));
    });
  }

  disconnect(): void {
    this.connection?.disconnect();
    this.connection = null;
    this.identity = null;
  }

  subscribeToRoom(roomCode: string): void {
    if (!this.connection) return;
    this.connection
      .subscriptionBuilder()
      .onApplied(() => {
        // Subscription active
      })
      .subscribe([
        `SELECT * FROM room WHERE room_code = '${roomCode}'`,
        `SELECT * FROM player WHERE room_code = '${roomCode}'`,
        `SELECT * FROM peer_signal WHERE room_code = '${roomCode}'`,
        `SELECT * FROM mute_state`,
      ]);
  }

  getIdentity(): Identity | null {
    return this.identity;
  }

  getIdentityHex(): string | null {
    return this.identity?.toHexString() ?? null;
  }

  getPlayersInRoom(roomCode: string): Player[] {
    if (!this.connection) return [];
    const players: Player[] = [];
    for (const player of this.connection.db.player.iter()) {
      if (player.roomCode === roomCode && player.isOnline) {
        players.push(player);
      }
    }
    return players;
  }

  sendSignal(toIdentity: Identity, signalType: string, signalData: string): void {
    this.connection?.reducers.sendSignal({ toIdentity, signalType, signalData });
  }

  cleanupSignals(roomCode: string): void {
    this.connection?.reducers.cleanupSignals({ roomCode });
  }

  cleanupSignalsForPeer(peerIdentity: Identity): void {
    this.connection?.reducers.cleanupSignalsForPeer({ peerIdentity });
  }

  setMute(mutedIdentity: Identity, isMuted: boolean): void {
    this.connection?.reducers.setMute({ mutedIdentity, isMuted });
  }

  bulkSetMute(isMuted: boolean): void {
    this.connection?.reducers.bulkSetMute({ isMuted });
  }

  onConnect(callback: ConnectionCallback): () => void {
    this.onConnectCallbacks.push(callback);
    return () => {
      this.onConnectCallbacks = this.onConnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  onDisconnect(callback: () => void): () => void {
    this.onDisconnectCallbacks.push(callback);
    return () => {
      this.onDisconnectCallbacks = this.onDisconnectCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPlayerJoin(callback: PlayerCallback): () => void {
    this.onPlayerJoinCallbacks.push(callback);
    return () => {
      this.onPlayerJoinCallbacks = this.onPlayerJoinCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPlayerLeave(callback: PlayerCallback): () => void {
    this.onPlayerLeaveCallbacks.push(callback);
    return () => {
      this.onPlayerLeaveCallbacks = this.onPlayerLeaveCallbacks.filter((cb) => cb !== callback);
    };
  }

  onPlayerUpdate(callback: (oldPlayer: Player, newPlayer: Player) => void): () => void {
    this.onPlayerUpdateCallbacks.push(callback);
    return () => {
      this.onPlayerUpdateCallbacks = this.onPlayerUpdateCallbacks.filter((cb) => cb !== callback);
    };
  }

  onSignalReceived(callback: SignalCallback): () => void {
    this.onSignalReceivedCallbacks.push(callback);
    return () => {
      this.onSignalReceivedCallbacks = this.onSignalReceivedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMuteStateChanged(callback: MuteCallback): () => void {
    this.onMuteStateChangedCallbacks.push(callback);
    return () => {
      this.onMuteStateChangedCallbacks = this.onMuteStateChangedCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onError(callback: ErrorCallback): () => void {
    this.onErrorCallbacks.push(callback);
    return () => {
      this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== callback);
    };
  }

  destroy(): void {
    this.disconnect();
    this.onConnectCallbacks = [];
    this.onDisconnectCallbacks = [];
    this.onPlayerJoinCallbacks = [];
    this.onPlayerLeaveCallbacks = [];
    this.onPlayerUpdateCallbacks = [];
    this.onSignalReceivedCallbacks = [];
    this.onMuteStateChangedCallbacks = [];
    this.onErrorCallbacks = [];
  }
}

export const spacetimeDBProvider = new SpacetimeDBProvider();
