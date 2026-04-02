<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { generateAITwisters } from '@/features/twister-generator';
  import { createSession, saveSession, gameSettingsStore } from '@/entities/session';
  import type { GameSettings } from '@/entities/session';
  import { parseGenerateTwistersPayload } from '@/shared/lib';
  import { get } from 'svelte/store';
  import { GameSettingsForm } from '@/widgets/game-settings-form';
  import styles from './solo-setup.module.scss';

  let isLoading = $state(false);
  let error = $state('');

  async function handleStartGame() {
    const storeState = get(gameSettingsStore);
    const useCustomTopic = storeState.useCustomTopic;
    const topic = useCustomTopic ? storeState.customTopic : storeState.selectedTopic;
    const length = storeState.length;
    const customLength = storeState.customLength;
    const rounds = storeState.rounds;

    let payload;
    try {
      payload = parseGenerateTwistersPayload({
        topic,
        length,
        customLength: length === 'custom' ? customLength : undefined,
        rounds,
      });
    } catch (err) {
      error = err instanceof Error ? err.message : 'Invalid game settings';
      return;
    }

    error = '';
    isLoading = true;

    try {
      const twisters = await generateAITwisters(
        payload.topic,
        payload.length,
        payload.customLength,
        payload.rounds ?? rounds
      );
      const settings: GameSettings = {
        topic: payload.topic,
        length: payload.length,
        customLength: payload.customLength,
        rounds: payload.rounds ?? rounds,
        autoSubmitEnabled: storeState.autoSubmitEnabled,
        autoSubmitDelay: storeState.autoSubmitDelay,
      };
      const session = createSession(twisters, settings);
      saveSession(session);
      push('/solo-game');
    } catch (err) {
      error = 'Failed to generate tongue twisters. Please try again.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

<GameSettingsForm
  title="solo session setup"
  subtitle="configure your isolated practice environment. all parameters are focused on individual speed and accuracy benchmarks."
  submitText="start solo game"
  onSubmit={handleStartGame}
  {isLoading}
  {error}
  showAutoSubmit={true}
/>
