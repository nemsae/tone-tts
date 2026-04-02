import type { TwisterLength as ValidationTwisterLength } from '@jaysonder/tts-validation';

export type TwisterLength = ValidationTwisterLength;
export type TwisterTopic = 'Animals' | 'Tech' | 'Food' | string;

export interface Twister {
  id: string;
  text: string;
  difficulty: 1 | 2 | 3;
  topic: TwisterTopic;
  length?: TwisterLength;
}
