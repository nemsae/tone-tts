import type { Twister, TwisterLength } from '@/shared/vendor';
import { generateTwisters } from '@/shared/api';

export type PredefinedTopic = 'Animals' | 'Tech' | 'Food';

export async function generateAITwisters(
  topic: string,
  length: TwisterLength,
  customLength: number | undefined,
  rounds: number
): Promise<Twister[]> {
  return generateTwisters({
    topic,
    length,
    customLength,
    rounds,
  });
}
