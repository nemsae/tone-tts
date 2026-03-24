<script lang="ts">
  import Icon from './Icon.svelte';

  interface NavButton {
    icon: string;
    label: string;
    active?: boolean;
    variant?: 'default' | 'primary' | 'danger';
    onClick?: () => void;
  }

  interface Props {
    variant?: 'light' | 'dark';
    buttons?: NavButton[];
    onMicClick?: () => void;
    onChatClick?: () => void;
    onPauseClick?: () => void;
    onQuitClick?: () => void;
  }

  const defaultButtons: NavButton[] = [
    { icon: 'mdi:microphone', label: 'MIC', variant: 'default' },
    { icon: 'mdi:chat', label: 'CHAT', variant: 'primary' },
    { icon: 'mdi:pause-circle', label: 'PAUSE', variant: 'default' },
  ];

  let { 
    variant = 'light', 
    buttons = defaultButtons,
    onMicClick,
    onChatClick,
    onPauseClick,
    onQuitClick
  }: Props = $props();

  function handleClick(btn: NavButton) {
    if (btn.onClick) {
      btn.onClick();
    } else if (btn.icon === 'mdi:microphone' && onMicClick) {
      onMicClick();
    } else if (btn.icon === 'mdi:chat' && onChatClick) {
      onChatClick();
    } else if (btn.icon === 'mdi:pause-circle' && onPauseClick) {
      onPauseClick();
    }
  }
</script>

<nav class="bottom-nav" class:dark={variant === 'dark'}>
  {#each buttons as btn}
    <button 
      class="nav-btn" 
      class:active={btn.active}
      class:primary={btn.variant === 'primary'}
      class:danger={btn.variant === 'danger'}
      onclick={() => handleClick(btn)}
    >
      <Icon icon={btn.icon} size={24} />
      <span class="label">{btn.label}</span>
    </button>
  {/each}

  {#if onQuitClick}
    <button class="nav-btn danger" onclick={onQuitClick}>
      <Icon icon="mdi:exit-to-app" size={24} />
      <span class="label">QUIT</span>
    </button>
  {/if}
</nav>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: vars.$z-fixed;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 0;
    background-color: white;
    height: vars.$nav-bottom-height;
    border-top: 4px solid vars.$color-primary;

    @media (min-width: 1024px) {
      left: vars.$nav-side-width;
    }

    &.dark {
      background-color: vars.$color-background-dark;
      border-top-color: vars.$color-surface-container-high-dark;

      .nav-btn {
        color: white;

        &:hover {
          background-color: white;
          color: black;
        }

        &.primary {
          background-color: vars.$color-primary-fixed;
          color: white;

          &:hover {
            background-color: white;
            color: vars.$color-primary-fixed;
          }
        }

        &.danger:hover {
          background-color: vars.$color-primary-fixed;
          color: white;
        }
      }
    }
  }

  .nav-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 0 vars.$spacing-8;
    color: vars.$color-on-surface;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all vars.$transition-fast;
    min-width: 80px;

    @media (min-width: 768px) {
      min-width: 120px;
    }

    :global(.iconify) {
      margin-bottom: vars.$spacing-1;
    }

    .label {
      font-family: vars.$font-family-headline;
      font-size: 0.625rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    &:hover {
      background-color: vars.$color-surface-container-low;
    }

    &:active {
      transform: translateY(2px);
    }

    &.primary {
      background-color: vars.$color-primary;
      color: white;

      &:hover {
        background-color: vars.$color-primary-container;
      }
    }

    &.danger:hover {
      background-color: vars.$color-primary;
      color: white;
    }
  }
</style>
