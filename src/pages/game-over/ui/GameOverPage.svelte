<script lang="ts">
  import { push } from 'svelte-spa-router';
  import Icon from '@/shared/ui/Icon.svelte';

  interface LeaderboardEntry {
    name: string;
    words: number;
    accuracy: number;
    score: number;
    color: 'red' | 'blue' | 'green' | 'yellow';
  }

  let sessionId = $state('xj92-k');

  let podium = $state<Array<{ rank: number; name: string; initials: string; color: 'red' | 'blue' | 'green' | 'yellow' }>>([
    { rank: 2, name: 'alex_v', initials: 'AL', color: 'blue' },
    { rank: 1, name: 'sarah_k', initials: 'SK', color: 'red' },
    { rank: 3, name: 'marc_99', initials: 'MC', color: 'green' },
  ]);

  let leaderboard = $state<LeaderboardEntry[]>([
    { name: 'sarah_k', words: 142, accuracy: 98.2, score: 14200, color: 'red' },
    { name: 'alex_v', words: 128, accuracy: 94.1, score: 11450, color: 'blue' },
    { name: 'marc_99', words: 115, accuracy: 91.5, score: 10210, color: 'green' },
    { name: 'jamie_z', words: 104, accuracy: 88.2, score: 8940, color: 'yellow' },
  ]);

  const colorMap = {
    red: 'bg-player-red',
    blue: 'bg-player-blue',
    green: 'bg-player-green',
    yellow: 'bg-player-yellow',
  };

  function handlePlayAgain() {
    push('/multiplayer');
  }

  function handleMainMenu() {
    push('/');
  }
</script>

<div class="page">
  <header class="top-bar">
    <div class="logo">twist & shout</div>
    <div class="session-info">
      <span class="session-label">session: {sessionId}</span>
    </div>
  </header>

  <main class="main-content">
    <section class="hero-section">
      <h1 class="hero-title">the results are in!</h1>
      <p class="hero-subtitle">
        a competitive display of lexical dexterity. well played to all participants in this session.
      </p>
    </section>

    <section class="podium-section">
      <div class="podium-grid">
        {#each podium as player}
          <div class="podium-card" class:first={player.rank === 1} class:second={player.rank === 2} class:third={player.rank === 3}>
            <div class="avatar-wrapper" class:large={player.rank === 1}>
              <div class="avatar {colorMap[player.color]}">
                {player.initials}
              </div>
              {#if player.rank === 1}
                <div class="crown">
                  <Icon icon="mdi:star" />
                </div>
              {/if}
            </div>
            <div class="player-info">
              <span class="rank-label">
                {#if player.rank === 1}
                  champion
                {:else}
                  {player.rank}{player.rank === 2 ? 'nd' : 'rd'} place
                {/if}
              </span>
              <span class="player-name">{player.name}</span>
            </div>
            <div class="podium-base">
              <span class="rank-number">{player.rank}</span>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <section class="results-section">
      <div class="results-table">
        <div class="table-header">
          <div class="header-cell">player</div>
          <div class="header-cell text-right">words</div>
          <div class="header-cell text-right">accuracy</div>
          <div class="header-cell text-right">score</div>
        </div>
        <div class="table-body">
          {#each leaderboard as entry}
            <div class="table-row">
              <div class="cell player-cell">
                <div class="color-dot {colorMap[entry.color]}"></div>
                <span class="player-name-cell">{entry.name}</span>
              </div>
              <div class="cell text-right tabular">{entry.words}</div>
              <div class="cell text-right tabular">{entry.accuracy}%</div>
              <div class="cell text-right font-bold tabular">{entry.score.toLocaleString()}</div>
            </div>
          {/each}
        </div>
      </div>
    </section>

    <section class="action-section">
      <button class="action-btn primary" onclick={handlePlayAgain}>
        play again
      </button>
      <button class="action-btn secondary" onclick={handleMainMenu}>
        main menu
      </button>
    </section>
  </main>

  <nav class="bottom-nav">
    <button class="nav-btn">
      <Icon icon="mdi:mic" />
      <span>mic</span>
    </button>
    <button class="nav-btn">
      <Icon icon="mdi:chat-outline" />
      <span>chat</span>
    </button>
    <button class="nav-btn active">
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
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    background-color: vars.$color-surface;
    position: sticky;
    top: 0;
    z-index: vars.$z-sticky;
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
    color: vars.$color-on-surface-variant;
  }

  .main-content {
    max-width: 48rem;
    margin: 0 auto;
    padding: 3rem 1.5rem 8rem;
  }

  .hero-section {
    text-align: center;
    margin-bottom: 6rem;
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
    max-width: 24rem;
    margin: 0 auto;
    line-height: 1.6;
  }

  .podium-section {
    margin-bottom: 6rem;
  }

  .podium-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 2rem;
    align-items: end;
  }

  .podium-card {
    grid-column: span 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    &.second {
      grid-column: 1 / 4;
      order: 1;
    }

    &.first {
      grid-column: 4 / 10;
      order: 2;
    }

    &.third {
      grid-column: 10 / 13;
      order: 3;
    }
  }

  .avatar-wrapper {
    position: relative;

    &.large {
      margin-top: -1.5rem;
    }
  }

  .avatar {
    width: 4rem;
    height: 4rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.875rem;
    color: white;
    border: 2px solid transparent;

    .first & {
      width: 6rem;
      height: 6rem;
      font-size: 1.25rem;
      border-width: 4px;
    }

    &.bg-player-red { background-color: vars.$color-player-red; border-color: vars.$color-player-red; }
    &.bg-player-blue { background-color: vars.$color-player-blue; border-color: vars.$color-player-blue; }
    &.bg-player-green { background-color: vars.$color-player-green; border-color: vars.$color-player-green; }
    &.bg-player-yellow { background-color: vars.$color-player-yellow; border-color: vars.$color-player-yellow; }
  }

  .crown {
    position: absolute;
    top: -1.5rem;
    left: 50%;
    transform: translateX(-50%);

    :global(.material-symbols-outlined) {
      font-size: 1.5rem;
      color: vars.$color-primary;
      font-variation-settings: 'FILL' 1;
    }
  }

  .player-info {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .rank-label {
    font-family: vars.$font-family-body;
    font-size: 0.75rem;
    color: vars.$color-on-surface-variant;
    text-transform: lowercase;
  }

  .player-name {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: lowercase;
    color: vars.$color-on-surface;
  }

  .podium-base {
    width: 100%;
    background-color: vars.$color-surface-container-low;
    border-radius: vars.$radius-lg vars.$radius-lg 0 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(26, 28, 28, 0.02) 100%);

    .first & {
      padding: 3rem 1.5rem;
    }
  }

  .rank-number {
    font-family: vars.$font-family-body;
    font-size: 2.5rem;
    font-weight: 700;
    color: vars.$color-on-surface;
    opacity: 0.1;

    .first & {
      font-size: 4rem;
      opacity: 0.15;
    }
  }

  .results-section {
    margin-bottom: 5rem;
  }

  .results-table {
    background-color: vars.$color-surface-container-lowest;
    border-radius: vars.$radius-xl;
    overflow: hidden;
    box-shadow: vars.$shadow-sm;
  }

  .table-header {
    display: grid;
    grid-template-columns: 1fr repeat(3, auto);
    padding: 1.5rem 2rem;
    background-color: vars.$color-surface-container-low;
    border-bottom: 1px solid rgba(vars.$color-outline-variant, 0.1);
  }

  .header-cell {
    font-family: vars.$font-family-body;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: lowercase;
    letter-spacing: 0.05em;
    color: vars.$color-on-surface-variant;
  }

  .table-body {
    display: flex;
    flex-direction: column;
  }

  .table-row {
    display: grid;
    grid-template-columns: 1fr repeat(3, auto);
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(vars.$color-outline-variant, 0.1);
    transition: background-color vars.$transition-fast;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background-color: vars.$color-surface-container;
    }
  }

  .cell {
    font-family: vars.$font-family-body;
    font-size: 0.875rem;
    color: vars.$color-on-surface;

    &.player-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    &.tabular {
      font-variant-numeric: tabular-nums;
    }

    &.text-right {
      text-align: right;
    }

    &.font-bold {
      font-weight: 700;
    }
  }

  .color-dot {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;

    &.bg-player-red { background-color: vars.$color-player-red; }
    &.bg-player-blue { background-color: vars.$color-player-blue; }
    &.bg-player-green { background-color: vars.$color-player-green; }
    &.bg-player-yellow { background-color: vars.$color-player-yellow; }
  }

  .player-name-cell {
    font-weight: 500;
    text-transform: lowercase;
  }

  .action-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    @media (min-width: 640px) {
      flex-direction: row;
      justify-content: center;
    }
  }

  .action-btn {
    width: 100%;
    padding: 1rem 2.5rem;
    font-family: vars.$font-family-body;
    font-size: 1rem;
    font-weight: 500;
    text-transform: lowercase;
    letter-spacing: -0.01em;
    border-radius: vars.$radius-md;
    transition: all vars.$transition-fast;

    @media (min-width: 640px) {
      width: auto;
    }

    &:active {
      transform: scale(0.98);
    }

    &.primary {
      background-color: vars.$color-primary;
      color: vars.$color-on-primary;

      &:hover {
        opacity: 0.9;
      }
    }

    &.secondary {
      background-color: transparent;
      border: 1px solid vars.$color-outline-variant;
      color: vars.$color-on-surface;

      &:hover {
        background-color: vars.$color-surface-container;
      }
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
      margin-bottom: 0.25rem;
    }

    span {
      font-family: vars.$font-family-body;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: lowercase;
    }
  }
</style>
