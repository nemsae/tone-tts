import type { GameSettings } from '@/shared/config';
import { multiplayerStore } from '@/shared/stores';

export async function createRoom(playerName: string, settings: GameSettings): Promise<boolean> {
  return multiplayerStore.createRoom(playerName, settings);
}
