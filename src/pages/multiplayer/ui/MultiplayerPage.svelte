<script lang="ts">
  import { push } from 'svelte-spa-router';
  import Icon from '@/shared/ui/Icon.svelte';

  interface PlayerScore {
    id: string;
    name: string;
    accuracy: number;
    isYou: boolean;
  }

  let sessionId = $state('xj92-k');
  let sessionTime = $state(42);
  let currentTwister = $state('Peter Piper picked a peck of pickled peppers.');
  let twisterSubtext = $state('A peck of pickled peppers Peter Piper picked. If Peter Piper picked a peck of pickled peppers, where\'s the peck of pickled peppers Peter Piper picked?');

  let players = $state<PlayerScore[]>([
    { id: '1', name: 'alex', accuracy: 88, isYou: false },
    { id: '2', name: 'jordan', accuracy: 92, isYou: false },
    { id: '3', name: 'casey (you)', accuracy: 45, isYou: true },
    { id: '4', name: 'morgan', accuracy: 12, isYou: false },
  ]);

  let micActive = $state(true);
  let chatActive = $state(false);

  const colorMap = ['player-red', 'player-blue', 'player-green', 'player-yellow'];
  const bgColorMap = ['bg-player-red', 'bg-player-blue', 'bg-player-green', 'bg-player-yellow'];

  function toggleMic() {
    micActive = !micActive;
  }

  function toggleChat() {
    chatActive = !chatActive;
  }

  function handleQuit() {
    push('/');
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
</script>

<div class="page">
  <header class="top-bar">
    <div class="logo">twist & shout</div>
    <div class="session-time">
      <span class="time-label">session time</span>
      <span class="time-value">{formatTime(sessionTime)}</span>
    </div>
    <div class="session-id">session: {sessionId}</div>
  </header>

  <main class="main-content">
    <section class="twister-section">
      <h1 class="twister-text">
        {currentTwister}
      </h1>
      <p class="twister-subtext">
        {twisterSubtext}
      </p>
    </section>

    <section class="players-section">
      <div class="players-grid">
        {#each players as player, i}
          <div class="player-card" class:highlighted={player.isYou}>
            <div class="player-header">
              <span class="player-name {colorMap[i]}">
                p{i + 1}: {player.name}
              </span>
              <span class="player-accuracy">{player.accuracy}%</span>
            </div>
            <div class="accuracy-bar">
              <div class="accuracy-fill {bgColorMap[i]}" style="width: {player.accuracy}%"></div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </main>

  <nav class="bottom-nav">
    <button class="nav-btn" class:active={micActive} onclick={toggleMic}>
      <Icon icon="mdi:mic" />
      <span>mic</span>
    </button>
    <button class="nav-btn" class:active={chatActive} onclick={toggleChat}>
      <Icon icon="mdi:chat-outline" />
      <span>chat</span>
    </button>
    <button class="nav-btn" onclick={handleQuit}>
      <Icon icon="mdi:pause-circle-outline" />
      <span>pause</span>
    </button>
  </nav>

  <div class="side-decoration">
    <span class="decoration-text">twist twist twist</span>
  </div>
</div>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .page {
    min-height: 100vh;
    background-color: vars.$color-surface;
    display: flex;
    flex-direction: column;
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

  .session-time {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .time-label {
    font-family: vars.$font-family-body;
    font-size: 0.75rem;
    font-weight: 400;
    text-transform: lowercase;
    color: vars.$color-on-surface-variant;
  }

  .time-value {
    font-family: vars.$font-family-body;
    font-size: 1.5rem;
    font-weight: 500;
    letter-spacing: -0.02em;
    color: vars.$color-on-surface;
  }

  .session-id {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 400;
    text-transform: lowercase;
    color: vars.$color-on-surface-variant;
  }

  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8rem 1.5rem 10rem;
  }

  .twister-section {
    max-width: 64rem;
    width: 100%;
    text-align: center;
    margin-bottom: 6rem;
  }

  .twister-text {
    font-family: vars.$font-family-body;
    font-size: 3.5rem;
    font-weight: 300;
    line-height: 1.1;
    letter-spacing: -0.01em;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    margin-bottom: 2rem;
  }

  .twister-subtext {
    font-family: vars.$font-family-body;
    font-size: 1.125rem;
    font-weight: 300;
    color: vars.$color-on-surface-variant;
    max-width: 42rem;
    margin: 0 auto;
    line-height: 1.6;
  }

  .players-section {
    width: 100%;
    max-width: 72rem;
  }

  .players-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1rem;

    @media (min-width: 768px) {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .player-card {
    background-color: vars.$color-surface-container-lowest;
    padding: 1.5rem;
    border-radius: vars.$radius-lg;
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &.highlighted {
      border-left: 2px solid vars.$color-player-green;
    }
  }

  .player-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .player-name {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 700;
    text-transform: lowercase;
  }

  .player-accuracy {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    color: vars.$color-on-surface-variant;
  }

  .accuracy-bar {
    height: 0.25rem;
    width: 100%;
    background-color: vars.$color-surface-container;
    border-radius: vars.$radius-lg;
    overflow: hidden;
  }

  .accuracy-fill {
    height: 100%;
    border-radius: vars.$radius-lg;
  }

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: vars.$z-fixed;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 1.5rem 3rem;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(vars.$color-primary, 0.1);
    box-shadow: vars.$shadow-nav;
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    padding: 0.5rem;
    color: vars.$color-on-surface-variant;
    opacity: 0.3;
    transition: all vars.$transition-fast;

    &:hover {
      opacity: 0.7;
    }

    &.active {
      opacity: 1;
      color: vars.$color-on-surface;
      transform: scale(1.1);

      :global(.material-symbols-outlined) {
        font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
      }
    }

    :global(.material-symbols-outlined) {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }

    span {
      font-family: vars.$font-family-body;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: lowercase;
    }
  }

  .side-decoration {
    position: fixed;
    left: 2rem;
    top: 50%;
    transform: translateY(-50%) rotate(-90deg);
    transform-origin: left center;
    opacity: 0.03;
    pointer-events: none;
    display: none;

    @media (min-width: 1280px) {
      display: block;
    }
  }

  .decoration-text {
    font-family: vars.$font-family-body;
    font-size: 6rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    white-space: nowrap;
    color: vars.$color-on-surface;
  }
</style>
