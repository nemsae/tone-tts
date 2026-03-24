<script lang="ts">
  import Icon from './Icon.svelte';

  interface Avatar {
    id: string;
    icon: string;
    selected?: boolean;
  }

  interface Props {
    avatars?: Avatar[];
    selectedId?: string;
    onSelect?: (id: string) => void;
    variant?: 'light' | 'dark';
  }

  const defaultAvatars: Avatar[] = [
    { id: 'face', icon: 'mdi:emoticon-outline', selected: true },
    { id: 'mood', icon: 'mdi:emoticon-happy-outline' },
    { id: 'psychology', icon: 'mdi:brain' },
    { id: 'robot_2', icon: 'mdi:robot' },
    { id: 'skull', icon: 'mdi:skull' },
    { id: 'sports_esports', icon: 'mdi:gamepad-variant' },
  ];

  let { 
    avatars = defaultAvatars,
    selectedId = 'face',
    onSelect,
    variant = 'light'
  }: Props = $props();

  function handleSelect(id: string) {
    if (onSelect) {
      onSelect(id);
    }
  }
</script>

<div class="avatar-grid" class:dark={variant === 'dark'}>
  {#each avatars as avatar}
    <button 
      class="avatar-btn" 
      class:selected={avatar.id === selectedId}
      onclick={() => handleSelect(avatar.id)}
    >
      <Icon icon={avatar.icon} />
    </button>
  {/each}
</div>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .avatar-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: vars.$spacing-3;

    @media (min-width: 640px) {
      grid-template-columns: repeat(6, 1fr);
    }

    &.dark {
      .avatar-btn {
        background-color: vars.$color-surface-container-high-dark;
        color: vars.$color-on-surface-variant-dark;

        &:hover {
          background-color: white;
          color: black;
        }

        &.selected {
          background-color: vars.$color-primary-fixed;
          color: white;
        }
      }
    }
  }

  .avatar-btn {
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: vars.$color-surface-container-high;
    border: none;
    cursor: pointer;
    transition: all vars.$transition-fast;

    :global(.icon) {
      font-size: 1.5rem;
      color: vars.$color-on-surface-variant;
    }

    &:hover {
      background-color: white;

      :global(.icon) {
        color: vars.$color-on-surface;
      }
    }

    &.selected {
      background-color: vars.$color-primary;
      border: none;

      :global(.icon) {
        color: white;
      }
    }
  }
</style>
