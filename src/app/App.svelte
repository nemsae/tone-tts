<script lang="ts">
  import Router from 'svelte-spa-router';
  import { HomePage, SoloPage } from '@/pages/home';
  import { PlayPage } from '@/pages/play';
  import { GameOverPage } from '@/pages/game-over';
  import { HostLobbyPage } from '@/pages/multiplayer';
  import { JoinRoomPage } from '@/pages/join-room';
  import { MultiplayerGamePage } from '@/pages/multiplayer-game';
  import { MultiplayerResultPage } from '@/pages/multiplayer-result';

  const routes = {
    '/': HomePage,
    '/solo': SoloPage,
    '/play': PlayPage,
    '/game-over': GameOverPage,
    '/multiplayer': HostLobbyPage,
    '/join-room': JoinRoomPage,
    '/multiplayer-game': MultiplayerGamePage,
    '/multiplayer-result': MultiplayerResultPage,
  };
</script>

<Router {routes} />
