<script lang="ts">
  import type { HTMLInputAttributes, HTMLInputTypeAttribute } from 'svelte/elements';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value'> {
    type?: HTMLInputTypeAttribute;
    value?: string | number;
    error?: string;
  }

  let { type = 'text', value = $bindable(''), error = '', class: className = '', ...restProps }: Props = $props();
</script>

<div class="input-wrapper {className}">
  <input
    {type}
    bind:value
    class="input-field"
    class:has-error={!!error}
    aria-invalid={error ? 'true' : undefined}
    {...restProps}
  />
  {#if error}
    <span class="input-error">{error}</span>
  {/if}
</div>

<style lang="scss">
  @use '../../app/styles/variables' as *;

  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: $spacing-xs;
    width: 100%;
  }

  .input-field {
    font-family: $font-family-base;
    font-size: 0.875rem;
    padding: $spacing-sm $spacing-md;
    background: $color-surface;
    color: $color-text;
    border: 2px solid $color-outline-variant;
    border-radius: $radius-md;
    transition: all $transition-fast;

    &::placeholder {
      color: $color-text-muted;
    }

    &:focus {
      outline: none;
      border-color: $color-primary;
    }

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 2px;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    &.has-error {
      border-color: $color-error;
    }
  }

  .input-error {
    font-family: $font-family-base;
    font-size: 0.75rem;
    color: $color-error;
  }
</style>
