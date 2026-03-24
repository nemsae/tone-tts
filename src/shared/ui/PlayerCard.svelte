<script lang="ts">
  import Icon from './Icon.svelte';

  interface Props {
    name: string;
    status?: 'host' | 'ready' | 'waiting';
    latency?: number;
    color?: 'primary' | 'secondary' | 'tertiary' | 'custom';
    customColor?: string;
    rank?: number;
    accuracy?: number;
    score?: number;
    speed?: number;
  }

  let { 
    name,
    status = 'waiting',
    latency = 0,
    color = 'primary',
    customColor,
    rank,
    accuracy,
    score,
    speed
  }: Props = $props();

  const statusLabels = {
    host: 'MASTER',
    ready: 'READY',
    waiting: 'WAITING'
  };

  const statusIcons = {
    host: 'mdi:star',
    ready: 'mdi:check-circle',
    waiting: 'mdi:hourglass-empty'
  };
</script>

<div 
  class="player-card"
  class:primary={color === 'primary'}
  class:secondary={color === 'secondary'}
  class:tertiary={color === 'tertiary'}
  style:--card-color={customColor || 'inherit'}
>
  <div class="color-bar"></div>
  
  <div class="card-content">
    <div class="card-header">
      <div class="avatar">
        <Icon icon="mdi:account" />
      </div>
      <span class="status-badge">{statusLabels[status]}</span>
    </div>

    <h3 class="player-name">{name}</h3>
    
    <div class="card-meta">
      {#if latency > 0}
        <p class="latency">Latency: {latency}ms</p>
      {/if}
      {#if rank}
        <p class="rank">RANK #{rank}</p>
      {/if}
    </div>

    <div class="card-footer">
      <span class="status-icon" class:filled={status === 'ready' || status === 'host'}>
        <Icon icon={statusIcons[status]} />
      </span>
    </div>

    {#if accuracy !== undefined || score !== undefined || speed !== undefined}
      <div class="stats">
        {#if accuracy !== undefined}
          <div class="stat-item">
            <span class="stat-label">Accuracy</span>
            <span class="stat-value">{accuracy}%</span>
          </div>
        {/if}
        {#if score !== undefined}
          <div class="stat-item">
            <span class="stat-label">Score</span>
            <span class="stat-value">{score.toLocaleString()} PTS</span>
          </div>
        {/if}
        {#if speed !== undefined}
          <div class="stat-item">
            <span class="stat-label">Speed</span>
            <span class="stat-value">{speed} WPM</span>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  @use '@/app/styles/variables.scss' as vars;

  .player-card {
    position: relative;
    background-color: vars.$color-surface-container-lowest;
    padding: vars.$spacing-6;
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-4;
    overflow: hidden;

    &.primary {
      --accent-color: #{vars.$color-primary};
    }

    &.secondary {
      --accent-color: #{vars.$color-secondary};
    }

    &.tertiary {
      --accent-color: #{vars.$color-tertiary};
    }

    &:not(.primary):not(.secondary):not(.tertiary) {
      --accent-color: var(--card-color);
    }
  }

  .color-bar {
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background-color: var(--accent-color);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-4;
    padding-left: vars.$spacing-2;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .avatar {
    width: 48px;
    height: 48px;
    background-color: var(--accent-color);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;

    :global(.icon) {
      font-size: 1.5rem;
      color: white;
    }
  }

  .status-badge {
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: vars.$spacing-1 vars.$spacing-2;
    background-color: var(--accent-color);
    color: white;
  }

  .player-name {
    font-family: vars.$font-family-headline;
    font-weight: 900;
    font-size: 1.125rem;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    color: vars.$color-on-surface;
  }

  .card-meta {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-1;
  }

  .latency,
  .rank {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: vars.$color-on-surface-variant;
    font-weight: 700;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
  }

  .status-icon {
    display: flex;
    align-items: center;
    justify-content: center;

    :global(.icon) {
      font-size: 1.5rem;
      color: var(--accent-color);
    }
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: vars.$spacing-2;
    margin-top: vars.$spacing-4;
    padding-top: vars.$spacing-4;
    border-top: 1px solid vars.$color-outline-variant;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .stat-label {
    font-size: 0.65rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: vars.$color-on-surface-variant;
    font-weight: 700;
  }

  .stat-value {
    font-family: vars.$font-family-headline;
    font-weight: 900;
    font-size: 1.25rem;
    color: var(--accent-color);
  }
</style>
