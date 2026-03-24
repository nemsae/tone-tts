<script lang="ts">
  import { push } from 'svelte-spa-router';
  import Icon from '@/shared/ui/Icon.svelte';

  interface Player {
    id: string;
    name: string;
    initials: string;
    status: 'host' | 'ready' | 'waiting' | 'connecting' | 'empty';
    latency?: number;
    color: 'red' | 'blue' | 'green' | 'yellow';
  }

  let players = $state<Player[]>([
    { id: '1', name: 'ace_host', initials: 'AH', status: 'host', latency: 12, color: 'red' },
    { id: '2', name: '', initials: '', status: 'waiting', color: 'red' },
    { id: '3', name: 'guest_4921', initials: '??', status: 'connecting', color: 'blue' },
    { id: '4', name: '', initials: '', status: 'empty', color: 'yellow' },
  ]);

  let sessionId = $state('xj92-k');
  let totalRounds = $state(5);
  let roundDuration = $state(45);
  let difficulty = $state<'casual' | 'pro' | 'chaos'>('casual');
  let theme = $state('minimal graphite');

  const colorMap = {
    red: { bg: 'bg-player-red', text: 'player-red' },
    blue: { bg: 'bg-player-blue', text: 'player-blue' },
    green: { bg: 'bg-player-green', text: 'player-green' },
    yellow: { bg: 'bg-player-yellow', text: 'player-yellow' },
  };

  function adjustRounds(delta: number) {
    totalRounds = Math.max(1, Math.min(20, totalRounds + delta));
  }

  function handleStart() {
    push('/multiplayer');
  }



  function getConnectedCount(): string {
    const count = players.filter(p => p.status === 'host' || p.status === 'ready' || p.status === 'connecting').length;
    return `${count}/4`;
  }
</script>

<div class="page">
  <header class="top-bar">
    <div class="logo">twist & shout</div>
    <div class="session-info">
      <span class="session-label">session: {sessionId}</span>
      <div class="notification-btn">
        <Icon icon="mdi:bell-outline" />
      </div>
    </div>
  </header>

  <div class="flex min-h-screen pt-24">
    <aside class="sidenav">
      <div class="sidenav-header">
        <div class="host-icon">
          <Icon icon="mdi:account-group" />
        </div>
        <div>
          <div class="host-title">host controls</div>
          <div class="host-subtitle">session management</div>
        </div>
      </div>

      <nav class="sidenav-nav">
        <a href="#" class="nav-item active">
          <Icon icon="mdi:account-group" />
          <span>lobby</span>
        </a>
        <a href="#" class="nav-item">
          <Icon icon="mdi:microphone" />
          <span>audio settings</span>
        </a>
        <a href="#" class="nav-item">
          <Icon icon="mdi:book-outline" />
          <span>game rules</span>
        </a>
        <a href="#" class="nav-item">
          <Icon icon="mdi:account-search" />
          <span>player list</span>
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <div class="content-wrapper">
        <section class="hero-section">
          <h1 class="hero-title">lobby room</h1>
          <p class="hero-subtitle">
            welcome to the twist & shout staging area. configure your session parameters below before the countdown initiates.
          </p>
        </section>

        <div class="grid-layout">
          <div class="players-column">
            <div class="players-header">
              <h2 class="players-title">ready players</h2>
              <span class="players-count">{getConnectedCount()} connected</span>
            </div>

            <div class="player-grid">
              {#each players as player}
                <div class="player-slot" class:host={player.status === 'host'} class:waiting={player.status === 'waiting'} class:connecting={player.status === 'connecting'} class:empty={player.status === 'empty'}>
                  <div class="slot-header">
                    {#if player.status !== 'waiting' && player.status !== 'empty'}
                      <div class="avatar {colorMap[player.color].bg}">
                        {player.initials}
                      </div>
                    {:else}
                      <div class="avatar placeholder">
                        <Icon icon="mdi:account" />
                      </div>
                    {/if}
                    
                    {#if player.status === 'host'}
                      <span class="status-badge host-badge">host</span>
                    {/if}
                  </div>

                  <div class="slot-footer">
                    {#if player.status === 'host' || player.status === 'ready'}
                      <p class="player-name">{player.name}</p>
                      <div class="ready-indicator">
                        <div class="ready-dot"></div>
                        <span class="ready-text">ready</span>
                      </div>
                    {:else if player.status === 'waiting'}
                      <p class="player-name waiting-text italic">waiting for joiner...</p>
                      <span class="slot-label">open slot</span>
                    {:else if player.status === 'connecting'}
                      <p class="player-name">{player.name}</p>
                      <div class="ready-indicator connecting">
                        <Icon icon="mdi:sync" />
                        <span class="ready-text">connecting</span>
                      </div>
                    {:else}
                      <span class="slot-label">empty</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          </div>

          <div class="settings-column">
            <div class="settings-card">
              <h2 class="settings-title">room settings</h2>

              <div class="settings-grid">
                <div class="setting-group">
                  <label class="setting-label">visual theme</label>
                  <div class="select-wrapper">
                    <select class="theme-select" bind:value={theme}>
                      <option>minimal graphite</option>
                      <option>arctic white</option>
                      <option>velvet dusk</option>
                    </select>
                    <Icon icon="mdi:chevron-down" />
                  </div>
                </div>

                <div class="setting-group">
                  <label class="setting-label">total rounds</label>
                  <div class="round-control">
                    <button class="round-btn" onclick={() => adjustRounds(-1)}>
                      <Icon icon="mdi:remove" />
                    </button>
                    <span class="round-value">{String(totalRounds).padStart(2, '0')}</span>
                    <button class="round-btn" onclick={() => adjustRounds(1)}>
                      <Icon icon="mdi:add" />
                    </button>
                  </div>
                </div>

                <div class="setting-group">
                  <div class="setting-header">
                    <label class="setting-label">round duration</label>
                    <span class="setting-value">{roundDuration}s</span>
                  </div>
                  <input class="duration-slider" type="range" min="15" max="120" bind:value={roundDuration} />
                </div>

                <div class="setting-group">
                  <label class="setting-label">difficulty</label>
                  <div class="difficulty-pills">
                    <button 
                      class="difficulty-pill" 
                      class:active={difficulty === 'casual'}
                      onclick={() => difficulty = 'casual'}
                    >
                      casual
                    </button>
                    <button 
                      class="difficulty-pill" 
                      class:active={difficulty === 'pro'}
                      onclick={() => difficulty = 'pro'}
                    >
                      pro
                    </button>
                    <button 
                      class="difficulty-pill" 
                      class:active={difficulty === 'chaos'}
                      onclick={() => difficulty = 'chaos'}
                    >
                      chaos
                    </button>
                  </div>
                </div>
              </div>

              <button class="start-btn" onclick={handleStart}>
                <span>start session</span>
                <Icon icon="mdi:play" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <nav class="bottom-nav">
    <button class="nav-btn">
      <Icon icon="mdi:mic" />
      <span>mic</span>
    </button>
    <button class="nav-btn active">
      <Icon icon="mdi:chat-outline" />
      <span>chat</span>
    </button>
    <button class="nav-btn">
      <Icon icon="mdi:pause-circle-outline" />
      <span>pause</span>
    </button>
  </nav>
</div>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .page {
    min-height: 100vh;
    background-color: vars.$color-surface;
    padding-bottom: vars.$nav-bottom-height;
  }

  .top-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: vars.$z-fixed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: vars.$color-surface;
  }

  .logo {
    font-family: vars.$font-family-body;
    font-size: 1.25rem;
    font-weight: 300;
    text-transform: lowercase;
    letter-spacing: -0.01em;
    color: vars.$color-on-surface;
  }

  .session-info {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .session-label {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 400;
    text-transform: lowercase;
    letter-spacing: 0;
    color: vars.$color-on-surface-variant;
  }

  .notification-btn {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: vars.$color-surface-container-high;
    border-radius: vars.$radius-full;
    cursor: pointer;
    transition: opacity vars.$transition-fast;

    &:hover {
      opacity: 0.8;
    }
  }

  .sidenav {
    display: none;

    @media (min-width: 768px) {
      display: flex;
      flex-direction: column;
      gap: 2rem;
      padding: 2.5rem 2rem;
      background-color: vars.$color-surface-container-low;
      width: 16rem;
      position: fixed;
      height: calc(100vh - vars.$nav-bottom-height);
      left: 0;
      top: 0;
    }
  }

  .sidenav-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .host-icon {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: vars.$color-primary;
    border-radius: vars.$radius-sm;

    :global(.material-symbols-outlined) {
      color: vars.$color-on-primary;
    }
  }

  .host-title {
    font-family: vars.$font-family-body;
    font-size: 1rem;
    font-weight: 700;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    line-height: 1.2;
  }

  .host-subtitle {
    font-family: vars.$font-family-body;
    font-size: 0.625rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: vars.$color-on-surface-variant;
    opacity: 0.6;
  }

  .sidenav-nav {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    border-left: 2px solid transparent;
    transition: all vars.$transition-fast;
    cursor: pointer;

    &:hover {
      opacity: 0.7;
    }

    &.active {
      border-left-color: vars.$color-primary;
      color: vars.$color-on-surface;
    }

    &:not(.active) {
      color: vars.$color-on-surface-variant;
      opacity: 0.4;
    }

    :global(.material-symbols-outlined) {
      font-size: 1.25rem;
    }
  }

  .main-content {
    flex: 1;
    padding: 2rem;
    padding-bottom: 8rem;

    @media (min-width: 1024px) {
      margin-left: 16rem;
      padding-left: 4rem;
      padding-right: 4rem;
    }
  }

  .content-wrapper {
    max-width: 72rem;
    margin: 0 auto;
  }

  .hero-section {
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
    font-size: 1rem;
    color: vars.$color-on-surface-variant;
    max-width: 36rem;
    line-height: 1.6;
  }

  .grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 3rem;

    @media (min-width: 1024px) {
      grid-template-columns: 7fr 5fr;
    }
  }

  .players-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .players-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }

  .players-title {
    font-family: vars.$font-family-body;
    font-size: 1.25rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
  }

  .players-count {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    opacity: 0.5;
  }

  .player-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .player-slot {
    background-color: vars.$color-surface-container-lowest;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    aspect-ratio: 1;
    border: 1px dashed transparent;
    transition: all vars.$transition-fast;

    &:hover {
      border-color: vars.$color-outline-variant;
    }

    &.host .avatar {
      background-color: vars.$color-player-red;
      color: white;
      font-weight: 700;
    }

    &.waiting, &.empty {
      opacity: 0.4;
    }

    &.connecting {
      opacity: 0.7;
    }
  }

  .slot-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .avatar {
    width: 3rem;
    height: 3rem;
    border-radius: vars.$radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;

    &.placeholder {
      background-color: vars.$color-surface-container-high;
      opacity: 0.2;
    }
  }

  .status-badge {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.25rem 0.5rem;
    border-radius: vars.$radius-sm;

    &.host-badge {
      background-color: vars.$color-player-red;
      color: white;
    }
  }

  .slot-footer {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .player-name {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;

    &.waiting-text {
      opacity: 0.4;
      font-style: italic;
    }
  }

  .ready-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: vars.$color-player-green;

    &.connecting {
      color: vars.$color-on-surface-variant;
      opacity: 0.4;

      :global(.material-symbols-outlined) {
        font-size: 0.875rem;
        animation: spin 1.5s linear infinite;
      }
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .ready-dot {
    width: 0.375rem;
    height: 0.375rem;
    border-radius: 50%;
    background-color: vars.$color-player-green;
  }

  .ready-text {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .slot-label {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.2;
  }

  .settings-column {
    display: flex;
    flex-direction: column;
  }

  .settings-card {
    background-color: vars.$color-surface-container-low;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
  }

  .settings-title {
    font-family: vars.$font-family-body;
    font-size: 1.25rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
  }

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .setting-label {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface-variant;
  }

  .setting-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .setting-value {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    color: vars.$color-on-surface;
  }

  .select-wrapper {
    position: relative;
  }

  .theme-select {
    width: 100%;
    background-color: vars.$color-surface-container-lowest;
    padding: 0.75rem 1rem;
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
    border: none;
    cursor: pointer;
    appearance: none;

    &:focus {
      box-shadow: inset 0 -1px 0 vars.$color-primary;
    }

    :global(.material-symbols-outlined) {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: vars.$color-on-surface-variant;
    }
  }

  .round-control {
    display: flex;
    align-items: center;
    gap: 1rem;
    background-color: vars.$color-surface-container-lowest;
    padding: 0.25rem;
  }

  .round-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: vars.$radius-sm;
    transition: background-color vars.$transition-fast;

    &:hover {
      background-color: vars.$color-surface-container-high;
    }
  }

  .round-value {
    flex: 1;
    text-align: center;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    font-weight: 500;
    color: vars.$color-on-surface;
  }

  .duration-slider {
    width: 100%;
    accent-color: vars.$color-primary;
    height: 0.25rem;
    background: vars.$color-surface-container-highest;
    border-radius: vars.$radius-lg;
    cursor: pointer;
  }

  .difficulty-pills {
    display: flex;
    gap: 0.25rem;
    background-color: vars.$color-surface-container-lowest;
    padding: 0.25rem;
  }

  .difficulty-pill {
    flex: 1;
    padding: 0.5rem;
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
      background-color: vars.$color-primary;
      color: vars.$color-on-primary;
    }
  }

  .start-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 1rem 1.5rem;
    background-color: vars.$color-primary;
    color: vars.$color-on-primary;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    font-weight: 500;
    text-transform: lowercase;
    letter-spacing: 0.02em;
    border: none;
    cursor: pointer;
    transition: opacity vars.$transition-fast;

    &:hover {
      opacity: 0.9;
    }

    &:active {
      transform: scale(0.98);
    }
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
    }

    :global(.material-symbols-outlined) {
      font-size: 1.5rem;
    }

    span {
      font-family: vars.$font-family-body;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: lowercase;
    }
  }
</style>
