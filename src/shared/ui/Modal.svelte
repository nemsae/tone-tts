<script lang="ts">
  import { tick } from 'svelte';
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: Snippet;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    confirmVariant?: 'primary' | 'secondary' | 'danger';
  }

  let {
    isOpen,
    onClose,
    title,
    children,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    confirmVariant = 'primary',
  }: Props = $props();

  let dialogElement = $state<HTMLDivElement | null>(null);
  let restoreFocusTarget = $state<HTMLElement | null>(null);

  const titleId = `modal-title-${Math.random().toString(36).slice(2, 10)}`;

  function getFocusableElements(): HTMLElement[] {
    if (!dialogElement) {
      return [];
    }

    return Array.from(
      dialogElement.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key !== 'Tab') {
      return;
    }

    const focusableElements = getFocusableElements();

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogElement?.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  $effect(() => {
    if (!isOpen) {
      return;
    }

    restoreFocusTarget = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    void tick().then(() => {
      const [firstFocusableElement] = getFocusableElements();
      (firstFocusableElement ?? dialogElement)?.focus();
    });

    return () => {
      restoreFocusTarget?.focus();
      restoreFocusTarget = null;
    };
  });
</script>

{#if isOpen}
  <div class="modal-shell">
    <div
      bind:this={dialogElement}
      class="modal-content"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
      onkeydown={handleKeydown}
    >
      <h2 class="modal-title" id={titleId}>{title}</h2>
      <div class="modal-body">
        {#if children}
          {@render children()}
        {/if}
      </div>
      <div class="modal-actions">
        {#if cancelLabel}
          <Button variant="secondary" onclick={onClose}>
            {cancelLabel}
          </Button>
        {/if}
        {#if onConfirm}
          <Button variant={confirmVariant} onclick={onConfirm}>
            {confirmLabel}
          </Button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  @use '../../app/styles/variables' as *;

  .modal-shell {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: $spacing-lg;
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    position: relative;
    background: $color-surface-container-lowest;
    border-radius: $radius-lg;
    padding: $spacing-xl;
    max-width: 400px;
    width: 100%;
    max-height: 80vh;
    overflow-y: auto;
    z-index: 1;

    &:focus-visible {
      outline: 2px solid $color-primary;
      outline-offset: 4px;
    }
  }

  .modal-title {
    font-family: $font-family-display;
    font-size: 1.5rem;
    font-weight: 600;
    color: $color-on-surface;
    margin-bottom: $spacing-lg;
  }

  .modal-body {
    font-family: $font-family-base;
    font-size: 0.875rem;
    color: $color-on-surface-variant;
    margin-bottom: $spacing-xl;
    line-height: 1.6;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: $spacing-sm;
  }
</style>
