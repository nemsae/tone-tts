<script lang="ts">
  import Icon from '@iconify/svelte';

  interface Props {
    icon: string;
    size?: number;
    class?: string;
  }

  let { icon, size = 24, class: className = '' }: Props = $props();
</script>

<Icon {icon} width={size} height={size} class={className} />
