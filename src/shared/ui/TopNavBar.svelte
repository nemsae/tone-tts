<script lang="ts">
  import { push } from 'svelte-spa-router';
  import Icon from './Icon.svelte';

  interface Props {
    variant?: 'light' | 'dark';
    currentRoute?: 'lobby' | 'rankings';
  }

  let { variant = 'light', currentRoute = 'lobby' }: Props = $props();

  function handleLogoClick() {
    push('/');
  }
</script>

<nav class="top-nav" class:dark={variant === 'dark'}>
  <button class="logo" onclick={handleLogoClick}>
    TONGUE_TWISTER
  </button>

  <div class="nav-links">
    <button 
      class:active={currentRoute === 'lobby'}
      onclick={() => push('/lobby')}
    >
      Lobby
    </button>
    <button 
      class:active={currentRoute === 'rankings'}
      onclick={() => {}}
    >
      Rankings
    </button>
  </div>

  <button class="account-btn">
    <Icon icon="mdi:account-circle" size={28} />
  </button>
</nav>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: vars.$z-fixed;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 vars.$spacing-6;
    height: vars.$nav-top-height;
    background-color: vars.$color-background;
    transition: background-color vars.$transition-fast;

    &.dark {
      background-color: vars.$color-background-dark;

      .logo,
      .nav-links button,
      .account-btn {
        color: vars.$color-on-surface-dark;
      }

      .nav-links button.active {
        color: vars.$color-primary-dark;
        border-bottom-color: vars.$color-primary-dark;
      }
    }
  }

  .logo {
    font-family: vars.$font-family-headline;
    font-size: 1.5rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    color: vars.$color-on-surface;
    font-style: italic;
    background: transparent;
    border: none;
    cursor: pointer;

    &:hover {
      opacity: 0.8;
    }
  }

  .nav-links {
    display: none;
    gap: vars.$spacing-10;
    height: 100%;

    @media (min-width: 768px) {
      display: flex;
    }
  }

  .nav-links button {
    display: flex;
    align-items: center;
    font-family: vars.$font-family-headline;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    color: vars.$color-on-surface-variant;
    padding: 0;
    border: none;
    background: transparent;
    height: 100%;
    cursor: pointer;

    &:hover {
      color: vars.$color-on-surface;
    }

    &.active {
      color: vars.$color-primary;
      border-bottom: 4px solid vars.$color-primary;
    }
  }

  .account-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: vars.$spacing-2;
    background: transparent;
    border: none;
    cursor: pointer;
    color: vars.$color-on-surface;
    transition: transform vars.$transition-fast;

    &:hover {
      opacity: 0.7;
    }

    &:active {
      transform: scale(0.95);
    }
  }
</style>
