<script lang="ts">
  import Router from 'svelte-spa-router';
  import { HomePage } from '@/pages/home';
  import { PlayPage } from '@/pages/play';
  import { GameOverPage } from '@/pages/game-over';
  import { LobbyPage } from '@/pages/lobby';
  import { MultiplayerPage } from '@/pages/multiplayer';

  const routes = {
    '/': HomePage,
    '/play': PlayPage,
    '/game-over': GameOverPage,
    '/lobby': LobbyPage,
    '/multiplayer': MultiplayerPage,
  };
</script>

<Router {routes} />
