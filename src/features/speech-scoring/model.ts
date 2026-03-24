import { multiplayerStore } from '@/shared/stores';

export async function submitAnswer(transcript: string): Promise<number | null> {
  return multiplayerStore.submitAnswer(transcript);
}

export async function startGame(): Promise<boolean> {
  return multiplayerStore.startGame();
}

export async function pauseGame(): Promise<boolean> {
  return multiplayerStore.pauseGame();
}

export async function resumeGame(): Promise<boolean> {
  return multiplayerStore.resumeGame();
}
