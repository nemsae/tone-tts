interface ActiveLobbyPlayersResponse {
  count: number;
}

export async function getActiveLobbyPlayerCount(): Promise<number> {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/api/lobby/active-players`);

  if (!response.ok) {
    throw new Error(`Failed to fetch lobby player count with status ${response.status}`);
  }

  const data: ActiveLobbyPlayersResponse = await response.json();
  if (typeof data.count !== 'number' || Number.isNaN(data.count)) {
    throw new Error('Invalid lobby player count response');
  }

  return data.count;
}
