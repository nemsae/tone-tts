import { describe, expect, it } from 'vitest';
import { calculateAccuracy, scoreTwister } from './model';

describe('scoreTwister', () => {
  it('marks an exact transcript as a match', () => {
    const result = scoreTwister('Peter Piper picked peppers', 'Peter Piper picked peppers');

    expect(result.isMatch).toBe(true);
    expect(result.similarity).toBe(100);
    expect(result.matchedWords).toEqual([true, true, true, true]);
  });
});

describe('calculateAccuracy', () => {
  it('rounds the average similarity across rounds', () => {
    const accuracy = calculateAccuracy({
      id: 'session-1',
      twisters: [],
      currentIndex: 2,
      startTime: 0,
      roundResults: [
        { twisterId: 'one', similarity: 82 },
        { twisterId: 'two', similarity: 97 },
      ],
    });

    expect(accuracy).toBe(90);
  });
});
