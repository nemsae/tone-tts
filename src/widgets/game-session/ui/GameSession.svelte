<script lang="ts">
  import { push } from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import type { Session, ScoringResult } from '@/entities/session';
  import {
    scoreTwister,
    getCurrentTwister,
    advanceSession,
    addRoundResult,
    isSessionComplete,
    calculateAccuracy,
    saveSession,
    loadSession,
    clearSession,
    saveFinalResult,
  } from '@/entities/session';
  import { speechStore, Modal } from '@/shared/ui';
  import GameHud from './GameHud.svelte';
  import TwisterCard from './TwisterCard.svelte';
  import styles from './game-session.module.scss';

  const DEFAULT_AUTO_CHECK_DELAY = 1500;
  const ROUND_ADVANCE_DELAY_MS = 500;
  const SUCCESS_DISPLAY_DELAY_MS = 1500;
  const TIMER_INTERVAL_MS = 100;
  const DIFFICULTY_LABELS = {
    short: 'Easy',
    medium: 'Medium',
    long: 'Hard',
    custom: 'Custom',
  } as const;

  let session = $state<Session | null>(null);
  let scoringResult = $state<ScoringResult | null>(null);
  let gameStarted = $state(false);
  let elapsedTime = $state(0);
  let gameStartTime = $state<number | null>(null);
  let hasMicPermission = $state<boolean | null>(null);
  let isPaused = $state(false);
  let pauseStartTime = $state<number | null>(null);
  let totalPausedTime = $state(0);
  let showSkipModal = $state(false);

  let autoCheckDelay = $derived(session?.settings?.autoSubmitDelay ?? DEFAULT_AUTO_CHECK_DELAY);
  let autoCheckEnabled = $derived(session?.settings?.autoSubmitEnabled ?? false);
  let autoCheckTimer: ReturnType<typeof setTimeout> | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  const currentTwister = $derived(session ? getCurrentTwister(session) : null);
  const liveScorePreview = $derived(
    currentTwister && $speechStore.isListening && $speechStore.transcript
      ? scoreTwister($speechStore.transcript, currentTwister.text)
      : null
  );
  const difficultyLabel = $derived.by(() => {
    const settings = session?.settings;

    if (!settings) {
      return '';
    }

    const label = DIFFICULTY_LABELS[settings.length];

    if (settings.length === 'custom' && settings.customLength) {
      return `${label} (${settings.customLength} words)`;
    }

    return label;
  });

  onMount(() => {
    session = loadSession();
    void checkMicPermission();

    const handleBeforeUnload = () => {
      speechStore.clearTranscript();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (autoCheckTimer) {
        clearTimeout(autoCheckTimer);
      }
      if (timerInterval) {
        clearInterval(timerInterval);
      }
      speechStore.stopListening();
      speechStore.clearTranscript();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  });

  async function checkMicPermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      hasMicPermission = true;
    } catch {
      hasMicPermission = false;
    }
  }

  function handleComplete(accuracy: number, finalElapsedTime: number) {
    saveFinalResult({ accuracy, elapsedTime: finalElapsedTime });
    clearSession();
    speechStore.stopListening();
    speechStore.clearTranscript();
    push('/solo-result');
  }

  function handleScore() {
    if (!currentTwister || !session || !$speechStore.transcript) {
      return;
    }

    const result = scoreTwister($speechStore.transcript, currentTwister.text);
    scoringResult = result;

    if (result.isMatch) {
      const newSession = addRoundResult(session, {
        twisterId: currentTwister.id,
        similarity: result.similarity,
      });
      session = newSession;
      saveSession(newSession);
    }
  }

  $effect(() => {
    const shouldCheck = autoCheckEnabled && autoCheckDelay > 0;

    if (autoCheckTimer) {
      clearTimeout(autoCheckTimer);
      autoCheckTimer = null;
    }

    if ($speechStore.isListening && $speechStore.transcript && shouldCheck) {
      autoCheckTimer = setTimeout(() => {
        handleScore();
      }, autoCheckDelay);
    }
  });

  function handleNext(sessionToUse?: Session) {
    const sessionToAdvance = sessionToUse ?? session;

    if (!currentTwister || !sessionToAdvance) {
      return;
    }

    scoringResult = null;

    if (autoCheckTimer) {
      clearTimeout(autoCheckTimer);
      autoCheckTimer = null;
    }

    speechStore.stopListening();
    speechStore.clearTranscript(true);

    setTimeout(() => {
      const nextSession = advanceSession(sessionToAdvance);

      if (isSessionComplete(nextSession)) {
        handleComplete(calculateAccuracy(nextSession), elapsedTime);
      } else {
        session = nextSession;
        saveSession(nextSession);
        speechStore.startListening();
      }
    }, ROUND_ADVANCE_DELAY_MS);
  }

  function handleSkip() {
    if (!currentTwister || !session) {
      return;
    }

    const result = scoreTwister('', currentTwister.text);
    result.isMatch = false;
    result.similarity = 0;
    scoringResult = result;

    const newSession = addRoundResult(session, { twisterId: currentTwister.id, similarity: 0 });
    session = newSession;
    saveSession(newSession);

    showSkipModal = false;
    handleNext(newSession);
  }

  $effect(() => {
    if (scoringResult?.isMatch) {
      const timer = setTimeout(() => {
        handleNext();
      }, SUCCESS_DISPLAY_DELAY_MS);
      return () => clearTimeout(timer);
    }
  });

  $effect(() => {
    const currentGameStartTime = gameStartTime;

    if (gameStarted && currentGameStartTime && !isPaused) {
      timerInterval = setInterval(() => {
        const currentTime = Date.now();
        const pausedTime = pauseStartTime ? currentTime - pauseStartTime : 0;
        elapsedTime = currentTime - currentGameStartTime - totalPausedTime - pausedTime;
      }, TIMER_INTERVAL_MS);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }
    };
  });

  function handleStartGame() {
    gameStartTime = Date.now();
    gameStarted = true;
    speechStore.startListening();
  }

  function handlePause() {
    isPaused = true;
    pauseStartTime = Date.now();
    speechStore.stopListening();
  }

  function handleResume() {
    if (pauseStartTime) {
      totalPausedTime += Date.now() - pauseStartTime;
    }
    isPaused = false;
    pauseStartTime = null;
    speechStore.startListening();
  }
</script>

{#if !currentTwister || !session}
  <div class={styles.loading}>Loading...</div>
{:else}
  <div class={styles.session}>
    {#if !gameStarted}
      <div class={styles.preGame}>
        <div class={styles.gameInfo}>
          <h2>Game Session</h2>
          <div class={styles.gameInfoItem}>
            <span class={styles.gameInfoLabel}>Theme:</span>
            <span class={styles.gameInfoValue}>{session.settings?.topic}</span>
          </div>
          <div class={styles.gameInfoItem}>
            <span class={styles.gameInfoLabel}>Difficulty:</span>
            <span class={styles.gameInfoValue}>{difficultyLabel}</span>
          </div>
          <div class={styles.gameInfoItem}>
            <span class={styles.gameInfoLabel}>Rounds:</span>
            <span class={styles.gameInfoValue}>{session.settings?.rounds}</span>
          </div>
          {#if hasMicPermission === false}
            <div class={styles.error}>
              Microphone access is required. Please enable it in your browser settings and refresh
              the page.
            </div>
          {/if}
        </div>
        <button class={styles.micButton} onclick={handleStartGame}>
          Start Speaking
        </button>
      </div>
    {:else}
      <div class={styles.gameStarted}>
        <GameHud {session} {elapsedTime} />

        <TwisterCard
          twister={currentTwister}
          matchedWords={scoringResult?.matchedWords ?? liveScorePreview?.matchedWords}
          wordsAttempted={scoringResult?.wordsAttempted ?? liveScorePreview?.wordsAttempted}
          settings={session?.settings}
        />

        <div class={styles.controls}>
          <div class={styles.transcript}>
            {$speechStore.transcript || ($speechStore.isListening ? 'Listening...' : 'Press the button and speak')}
          </div>

          {#if $speechStore.error}
            <div class={styles.error}>{$speechStore.error}</div>
          {/if}

          {#if scoringResult}
            <div
              class="{styles.result} {scoringResult.isMatch ? styles.success : styles.failure}"
            >
              {scoringResult.isMatch
                ? 'Great job!'
                : `Try again! (${scoringResult.similarity}% match)`}
            </div>
          {/if}

          <div class={styles.buttons}>
            {#if !$speechStore.isListening}
              <button class={styles.micButton} onclick={() => speechStore.startListening()}>
                Start Listening
              </button>
            {:else}
              <button class="{styles.micButton} {styles.listening}" onclick={handlePause}>
                Stop
              </button>
              {#if !autoCheckEnabled && $speechStore.transcript}
                <button class={styles.submitButton} onclick={handleScore}>
                  Submit Answer
                </button>
              {/if}
            {/if}

            <button class={styles.skipButton} onclick={() => showSkipModal = true}>
              Skip
            </button>

            {#if $speechStore.transcript}
              <button class={styles.resetButton} onclick={() => speechStore.clearTranscript(true)}>
                Reset
              </button>
            {/if}
          </div>
        </div>

        {#if isPaused}
          <Modal
            isOpen={isPaused}
            onClose={() => {}}
            title="Game Paused"
            confirmLabel="Resume Game"
            cancelLabel=""
            onConfirm={handleResume}
          >
            <p>Take a break! Click resume when you're ready to continue.</p>
          </Modal>
        {/if}

        <Modal
          isOpen={showSkipModal}
          onClose={() => showSkipModal = false}
          title="Skip Round?"
          confirmLabel="Skip"
          cancelLabel="Continue Playing"
          onConfirm={handleSkip}
          confirmVariant="danger"
        >
          <p>Are you sure you want to skip this round?</p>
          <p style="margin-top: 8px;">
            Skipping will count as a <strong>0% match</strong> and will affect your final accuracy
            score.
          </p>
        </Modal>
      </div>
    {/if}
  </div>
{/if}
