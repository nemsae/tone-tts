<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { generateAITwisters } from '@/features/twister-generator';
  import { createSession, saveSession, gameSettingsStore, type GameSettings, validateTopic } from '@/entities/session';
  import { GameSettingsForm } from '@/widgets/game-settings-form';
  import styles from './solo-setup.module.scss';

  let isLoading = $state(false);
  let error = $state('');

  async function handleStartGame() {
    const useCustomTopic = gameSettingsStore.useCustomTopic;
    const topic = useCustomTopic ? gameSettingsStore.customTopic : gameSettingsStore.selectedTopic;
    const length = gameSettingsStore.length;
    const customLength = gameSettingsStore.customLength;
    const rounds = gameSettingsStore.rounds;

    if (!topic) {
      error = 'Please select or enter a topic';
      return;
    }

    // Validate custom topic
    if (useCustomTopic) {
      const validationError = validateTopic(topic);
      if (validationError) {
        error = validationError;
        return;
      }
    }

    if (length === 'custom' && (customLength < 5 || customLength > 40)) {
      error = 'Custom difficulty must be between 5 and 40 words';
      return;
    }

    error = '';
    isLoading = true;

    try {
      const twisters = await generateAITwisters(
        topic,
        length,
        length === 'custom' ? customLength : undefined,
        rounds
      );
      const settings: GameSettings = {
        topic,
        length,
        customLength: length === 'custom' ? customLength : undefined,
        rounds,
        autoSubmitEnabled: gameSettingsStore.autoSubmitEnabled,
        autoSubmitDelay: gameSettingsStore.autoSubmitDelay,
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
