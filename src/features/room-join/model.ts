import { multiplayerStore } from '@/shared/stores';

export async function joinRoom(roomCode: string, playerName: string): Promise<boolean> {
  return multiplayerStore.joinRoom(roomCode, playerName);
}
