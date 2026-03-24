<script lang="ts">
  import Icon from './Icon.svelte';

  interface NavItem {
    icon: string;
    label: string;
    active?: boolean;
    href?: string;
  }

  interface Props {
    variant?: 'light' | 'dark';
    playerName?: string;
    playerRank?: string;
    sessionId?: string;
    items?: NavItem[];
  }

  const defaultItems: NavItem[] = [
    { icon: 'mdi:cog', label: 'Game Settings', active: true },
    { icon: 'mdi:mic', label: 'Audio Input' },
    { icon: 'mdi:lock', label: 'Privacy' },
    { icon: 'mdi:translate', label: 'Language' },
    { icon: 'mdi:file-document', label: 'Terms' },
  ];

  let { 
    variant = 'light', 
    playerName = 'PLAYER_01',
    playerRank = 'Silver',
    sessionId = '',
    items = defaultItems
  }: Props = $props();
</script>

<aside class="side-nav" class:dark={variant === 'dark'}>
  <div class="session-header">
    <div class="player-info">
      <div class="avatar-placeholder"></div>
      <div class="player-details">
        <p class="player-name">{playerName}</p>
        <p class="player-rank">Rank: {playerRank}</p>
      </div>
    </div>
    {#if sessionId}
      <p class="session-id">SESSION_ID: {sessionId}</p>
    {/if}
  </div>

  <nav class="nav-items">
    {#each items as item}
      <button 
        class="nav-item" 
        class:active={item.active}
        onclick={() => {}}
      >
        <Icon icon={item.icon} size={24} />
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>

  <div class="nav-footer">
    <button class="upgrade-btn">GO_PRO</button>
  </div>
</aside>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .side-nav {
    position: fixed;
    left: 0;
    top: 0;
    height: 100%;
    width: vars.$nav-side-width;
    background-color: vars.$color-surface-container-low;
    display: flex;
    flex-direction: column;
    z-index: vars.$z-sticky;
    padding-top: vars.$nav-top-height;
    display: none;

    @media (min-width: 1024px) {
      display: flex;
    }

    &.dark {
      background-color: vars.$color-surface-container-lowest-dark;
      box-shadow: vars.$shadow-nav;

      .nav-item {
        color: white;

        &:hover {
          background-color: vars.$color-primary-fixed;
          color: white;
        }

        &.active {
          background-color: white;
          color: black;
          font-weight: 900;
        }
      }

      .upgrade-btn {
        border: 2px solid white;
        color: white;

        &:hover {
          background-color: white;
          color: black;
        }
      }
    }
  }

  .session-header {
    padding: vars.$spacing-8 vars.$spacing-8 vars.$spacing-10;
  }

  .player-info {
    display: flex;
    align-items: center;
    gap: vars.$spacing-3;
    margin-bottom: vars.$spacing-4;
  }

  .avatar-placeholder {
    width: 40px;
    height: 40px;
    background-color: vars.$color-on-surface;
  }

  .player-details {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-1;
  }

  .player-name {
    font-family: vars.$font-family-headline;
    font-weight: 700;
    font-size: 1.25rem;
    text-transform: uppercase;
    letter-spacing: -0.01em;
    color: vars.$color-on-surface;
  }

  .player-rank {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: vars.$color-on-surface-variant;
    font-weight: 700;
  }

  .session-id {
    font-size: 0.625rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: vars.$color-outline;
    font-weight: 700;
  }

  .nav-items {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-1;
    flex: 1;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: vars.$spacing-4;
    padding: vars.$spacing-4 vars.$spacing-8;
    font-family: vars.$font-family-headline;
    font-weight: 700;
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: vars.$color-on-surface;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all vars.$transition-fast;
    text-align: left;

    &:hover {
      background-color: white;
      transform: translateX(4px);
    }

    &.active {
      background-color: vars.$color-primary;
      color: white;
    }
  }

  .nav-footer {
    padding: vars.$spacing-8;
    margin-top: auto;
  }

  .upgrade-btn {
    width: 100%;
    padding: vars.$spacing-4;
    background-color: vars.$color-primary;
    color: white;
    font-family: vars.$font-family-headline;
    font-weight: 900;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    border: none;
    cursor: pointer;
    transition: all vars.$transition-fast;

    &:hover {
      opacity: 0.9;
    }

    &:active {
      transform: scale(0.98);
    }
  }
</style>
