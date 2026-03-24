<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { generateAITwisters, isApiKeyConfigured } from '@/features/twister-generator';
  import { createSession, saveSession, gameSettingsStore, PREDEFINED_TOPICS, type GameSettings } from '@/entities/session';
  import { createRoom } from '@/features/room-create';
  import { multiplayerStore } from '@/shared/stores/multiplayer';
  import type { TwisterLength, GameSettings as MultiplayerGameSettings } from '@/shared/config';
  import Icon from '@/shared/ui/Icon.svelte';
  import styles from './home.module.scss';

  type GameMode = 'solo' | 'multiplayer';
  type AvatarType = 'face' | 'mood' | 'cruelty' | 'med' | 'psych';

  const AVATARS: { id: AvatarType; icon: string; label: string }[] = [
    { id: 'face', icon: 'mdi:face', label: 'Default' },
    { id: 'mood', icon: 'mdi:mood', label: 'Happy' },
    { id: 'cruelty', icon: 'mdi:paw', label: 'Animal' },
    { id: 'med', icon: 'mdi:medical-bag', label: 'Medical' },
    { id: 'psych', icon: 'mdi:brain', label: 'Brain' },
  ];

  const DIFFICULTY_OPTIONS: { value: TwisterLength; label: string; words: string }[] = [
    { value: 'short', label: 'Easy', words: '~5 words' },
    { value: 'medium', label: 'Medium', words: '~10 words' },
    { value: 'long', label: 'Hard', words: '~20 words' },
    { value: 'custom', label: 'Custom', words: '5-40 words' },
  ];
  const ROUND_MIN = 1;
  const ROUND_MAX = 10;

  let gameMode = $state<GameMode>('solo');
  let isLoading = $state(false);
  let selectedAvatar = $state<AvatarType>('mood');

  let hostName = $state('');
  let joinCode = $state('');

  let soloError = $state('');
  let multiplayerError = $state('');

  let playersWaiting = $state(12);

  async function handleStartSoloGame() {
    const topic = gameSettingsStore.topic;
    const length = gameSettingsStore.length;
    const customLength = gameSettingsStore.customLength;
    const rounds = gameSettingsStore.rounds;
    const useCustomTopic = gameSettingsStore.useCustomTopic;

    if (!topic) {
      soloError = 'Please select or enter a topic';
      return;
    }

    if (useCustomTopic && topic.length < 2) {
      soloError = 'Custom topic must be at least 2 characters';
      return;
    }

    if (length === 'custom' && (customLength < 5 || customLength > 40)) {
      soloError = 'Custom difficulty must be between 5 and 40 words';
      return;
    }

    soloError = '';
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
      };
      const session = createSession(twisters, settings);
      saveSession(session);
      push('/play');
    } catch (err) {
      soloError = 'Failed to generate tongue twisters. Please check your API key.';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }

  async function handleHostGame() {
    if (!hostName.trim()) {
      multiplayerError = 'Please enter your name';
      return;
    }

    const topic = gameSettingsStore.topic;
    const length = gameSettingsStore.length;
    const customLength = gameSettingsStore.customLength;
    const rounds = gameSettingsStore.rounds;

    if (!topic) {
      multiplayerError = 'Please select or enter a topic';
      return;
    }

    multiplayerError = '';
    isLoading = true;

    try {
      multiplayerStore.connect();
      const settings: MultiplayerGameSettings = {
        topic,
        length,
        customLength: length === 'custom' ? customLength : undefined,
        rounds,
      };
      const success = await createRoom(hostName.trim(), settings);
      if (success) {
        push('/lobby');
      }
    } catch (err) {
      multiplayerError = 'Failed to create room. Is the server running?';
      console.error(err);
    } finally {
      isLoading = false;
    }
  }
</script>

{#if !isApiKeyConfigured()}
  <div class={styles.page}>
    <header class="top-bar">
      <div class="logo">twist & shout</div>
    </header>
    <div class={styles['main-content']}>
      <div class="api-key-warning">
        <h1>Configure API Key</h1>
        <p>Add your OpenAI API key to the .env file as VITE_OPENAI_API_KEY to start playing.</p>
      </div>
    </div>
  </div>
{:else}
  <div class="page">
    <header class="top-bar">
      <div class="logo">twist & shout</div>
    </header>

    <main class="main-content">
      <div class="content-wrapper">
        <div class="hero-section">
          <h1 class="hero-title">ready to twist?</h1>
          <p class="hero-subtitle">
            enter your details to start a game.
          </p>
        </div>

        <div class="form-container">
          <section class="avatar-section">
            <label class="section-label">select your persona</label>
            <div class="avatar-grid">
              {#each AVATARS as avatar}
                <button 
                  class="avatar-btn"
                  class:selected={selectedAvatar === avatar.id}
                  onclick={() => selectedAvatar = avatar.id}
                >
                  <Icon icon={avatar.icon} />
                </button>
              {/each}
            </div>
          </section>

          <div class="form-grid">
            {#if gameMode === 'solo'}
              <div class="form-group">
                <label class="form-label" for="topic-input">topic</label>
                <input
                  id="topic-input"
                  type="text"
                  class="form-input"
                  placeholder="e.g. Animals, Food..."
                  value={$gameSettingsStore.useCustomTopic ? $gameSettingsStore.customTopic : ''}
                  oninput={(e) => gameSettingsStore.setCustomTopic(e.currentTarget.value)}
                />
              </div>

              <div class="form-group">
                <span class="form-label">preset topics</span>
                <div class="topic-pills">
                  {#each PREDEFINED_TOPICS as topic}
                    <button
                      class="topic-pill"
                      class:selected={$gameSettingsStore.selectedTopic === topic && !$gameSettingsStore.useCustomTopic}
                      onclick={() => gameSettingsStore.setSelectedTopic(topic)}
                    >
                      {topic}
                    </button>
                  {/each}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="difficulty-select">difficulty</label>
                <select
                  id="difficulty-select"
                  class="form-select"
                  value={$gameSettingsStore.length}
                  onchange={(e) => gameSettingsStore.setLength(e.currentTarget.value as TwisterLength)}
                >
                  {#each DIFFICULTY_OPTIONS as option}
                    <option value={option.value}>{option.label} ({option.words})</option>
                  {/each}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="rounds-input">rounds: {$gameSettingsStore.rounds}</label>
                <input
                  id="rounds-input"
                  type="range"
                  class="form-slider"
                  min={ROUND_MIN}
                  max={ROUND_MAX}
                  value={$gameSettingsStore.rounds}
                  oninput={(e) => gameSettingsStore.setRounds(Number(e.currentTarget.value))}
                />
              </div>
            {:else}
              <div class="multiplayer-tabs">
                <button 
                  class="tab-btn"
                  class:active={gameMode === 'multiplayer'}
                  onclick={() => gameMode = 'multiplayer'}
                >
                  Host
                </button>
                <button 
                  class="tab-btn"
                  onclick={() => gameMode = 'solo'}
                >
                  Solo
                </button>
              </div>

              <div class="form-group">
                <label class="form-label" for="host-name">nickname</label>
                <input
                  id="host-name"
                  type="text"
                  class="form-input"
                  placeholder="e.g. dancer_01"
                  bind:value={hostName}
                />
              </div>

              <div class="form-group">
                <label class="form-label" for="room-code">room code</label>
                <input
                  id="room-code"
                  type="text"
                  class="form-input"
                  placeholder="xj92-k"
                  bind:value={joinCode}
                  style="text-transform: uppercase;"
                />
              </div>
            {/if}
          </div>

          {#if soloError || multiplayerError}
            <div class="error-message">{soloError || multiplayerError}</div>
          {/if}

          <button 
            class="join-btn"
            onclick={gameMode === 'solo' ? handleStartSoloGame : handleHostGame}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Initialize Join'}
          </button>
        </div>

        <div class="footer-meta">
          <div class="meta-item">
            <Icon icon="mdi:account-group" />
            <span>{playersWaiting} players waiting</span>
          </div>
          <div class="meta-item">
            <Icon icon="mdi:lightning-bolt" />
            <span>low latency active</span>
          </div>
        </div>
      </div>
    </main>

    <div class="side-decoration">
      <span class="decoration-text">TS</span>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .page {
    min-height: 100vh;
    background-color: vars.$color-surface;
  }

  .top-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: vars.$color-surface;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: vars.$z-fixed;
  }

  .logo {
    font-family: vars.$font-family-body;
    font-size: 1.25rem;
    font-weight: 300;
    text-transform: lowercase;
    letter-spacing: -0.01em;
    color: vars.$color-on-surface;
  }

  .main-content {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8rem 1.5rem 4rem;
  }

  .content-wrapper {
    width: 100%;
    max-width: 36rem;
  }

  .hero-section {
    text-align: center;
    margin-bottom: 4rem;
  }

  .hero-title {
    font-family: vars.$font-family-body;
    font-size: 3.5rem;
    font-weight: 300;
    line-height: 1;
    letter-spacing: -0.02em;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    margin-bottom: 1rem;
  }

  .hero-subtitle {
    font-family: vars.$font-family-body;
    font-size: 1.125rem;
    font-weight: 300;
    color: vars.$color-on-surface-variant;
  }

  .form-container {
    background-color: vars.$color-surface-container-low;
    padding: 2.5rem;
    display: flex;
    flex-direction: column;
    gap: 3rem;
  }

  .avatar-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .section-label {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    opacity: 0.6;
  }

  .avatar-grid {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
  }

  .avatar-btn {
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: vars.$color-surface-container-lowest;
    border-radius: vars.$radius-sm;
    transition: opacity vars.$transition-fast;

    &:hover {
      opacity: 0.7;
    }

    &.selected {
      border: 2px solid #3b82f6;
      background-color: rgba(59, 130, 246, 0.1);

      :global(.material-symbols-outlined) {
        color: #3b82f6;
      }
    }

    :global(.material-symbols-outlined) {
      font-size: 1.75rem;
      color: vars.$color-on-surface-variant;
    }
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2rem;

    @media (min-width: 640px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .multiplayer-tabs {
    grid-column: 1 / -1;
    display: flex;
    gap: 0.25rem;
    background-color: vars.$color-surface-container-lowest;
    padding: 0.25rem;
  }

  .tab-btn {
    flex: 1;
    padding: 0.75rem;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    border-radius: vars.$radius-sm;
    transition: all vars.$transition-fast;

    &:hover {
      background-color: vars.$color-surface-container-high;
    }

    &.active {
      background-color: #3b82f6;
      color: white;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .form-label {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    opacity: 0.6;
  }

  .form-input {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid vars.$color-outline-variant;
    padding: 0.5rem 0;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    color: vars.$color-on-surface;
    transition: border-color vars.$transition-fast;

    &:focus {
      border-bottom-color: vars.$color-on-surface;
      outline: none;
    }

    &::placeholder {
      color: vars.$color-on-surface;
      opacity: 0.2;
    }
  }

  .form-select {
    width: 100%;
    background: transparent;
    border: none;
    border-bottom: 1px solid vars.$color-outline-variant;
    padding: 0.5rem 0;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    color: vars.$color-on-surface;
    cursor: pointer;

    &:focus {
      border-bottom-color: vars.$color-on-surface;
      outline: none;
    }
  }

  .form-slider {
    width: 100%;
    accent-color: vars.$color-primary;
    height: 0.25rem;
    background: vars.$color-surface-container-highest;
    border-radius: vars.$radius-lg;
    cursor: pointer;
  }

  .topic-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .topic-pill {
    padding: 0.5rem 1rem;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    background-color: vars.$color-surface-container-lowest;
    border-radius: vars.$radius-sm;
    transition: all vars.$transition-fast;

    &:hover {
      background-color: vars.$color-surface-container-high;
    }

    &.selected {
      background-color: vars.$color-primary;
      color: vars.$color-on-primary;
    }
  }

  .error-message {
    padding: 1rem;
    background-color: vars.$color-error-container;
    color: vars.$color-on-error-container;
    border-radius: vars.$radius-sm;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
  }

  .join-btn {
    width: 100%;
    padding: 1.25rem 2rem;
    background-color: #3b82f6;
    color: white;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    font-weight: 500;
    text-transform: lowercase;
    letter-spacing: 0.02em;
    border: none;
    border-radius: vars.$radius-md;
    cursor: pointer;
    transition: all vars.$transition-fast;

    &:hover {
      opacity: 0.9;
    }

    &:active {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .footer-meta {
    margin-top: 2rem;
    display: flex;
    justify-content: center;
    gap: 2rem;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    color: vars.$color-on-surface-variant;
    opacity: 0.4;

    :global(.material-symbols-outlined) {
      font-size: 1rem;
    }
  }

  .side-decoration {
    position: fixed;
    bottom: 3rem;
    right: 3rem;
    opacity: 0.03;
    pointer-events: none;
    display: none;

    @media (min-width: 1024px) {
      display: block;
    }
  }

  .decoration-text {
    font-family: vars.$font-family-body;
    font-size: 8rem;
    font-weight: 900;
    line-height: 1;
    color: vars.$color-on-surface;
  }

  .api-key-warning {
    text-align: center;
    padding: 3rem;
    background-color: vars.$color-surface-container-low;
    border-radius: vars.$radius-xl;

    h1 {
      font-family: vars.$font-family-body;
      font-size: 1.5rem;
      font-weight: 700;
      text-transform: lowercase;
      margin-bottom: 1rem;
    }

    p {
      font-family: vars.$font-family-body;
      color: vars.$color-on-surface-variant;
    }
  }
</style>
