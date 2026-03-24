import { ROUND_DURATION } from '@/shared/config';

export interface CountdownState {
  remaining: number;
  progress: number;
  isExpired: boolean;
}

export function createCountdown(
  roundStartTime: number,
  onTick: (state: CountdownState) => void,
  onExpire: () => void
): { stop: () => void; getRemaining: () => number } {
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let expired = false;

  const calculateRemaining = (): number => {
    const elapsed = Date.now() - roundStartTime;
    return Math.max(0, ROUND_DURATION - elapsed);
  };

  const tick = () => {
    const remaining = calculateRemaining();
    const progress = 1 - remaining / ROUND_DURATION;
    const isExpired = remaining <= 0;

    onTick({ remaining, progress, isExpired });

    if (isExpired && !expired) {
      expired = true;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      onExpire();
    }
  };

  intervalId = setInterval(tick, 100);

  return {
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    getRemaining: calculateRemaining,
  };
}

export function formatCountdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  return seconds.toString();
}
