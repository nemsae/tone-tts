import { VAD_THRESHOLD, VAD_SMOOTHING } from './types';

export class AudioPipeline {
  private localStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyserNodes: Map<string, AnalyserNode> = new Map();
  private remoteAudioElements: Map<string, HTMLAudioElement> = new Map();
  private vadIntervalId: ReturnType<typeof setInterval> | null = null;
  private onSpeakingChange: ((peerIdentityHex: string, isSpeaking: boolean) => void) | null = null;
  private localSpeakingCallback: ((isSpeaking: boolean) => void) | null = null;
  private localAnalyser: AnalyserNode | null = null;
  private smoothedVolumes: Map<string, number> = new Map();

  async captureLocalAudio(): Promise<MediaStream> {
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.localStream);
    this.localAnalyser = this.audioContext.createAnalyser();
    this.localAnalyser.fftSize = 256;
    source.connect(this.localAnalyser);

    this.startVADLoop();
    return this.localStream;
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  setMuted(isMuted: boolean): void {
    if (!this.localStream) return;
    for (const track of this.localStream.getAudioTracks()) {
      track.enabled = !isMuted;
    }
  }

  attachRemoteStream(peerIdentityHex: string, stream: MediaStream): void {
    let audioEl = this.remoteAudioElements.get(peerIdentityHex);
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.setAttribute('data-peer', peerIdentityHex);
      document.body.appendChild(audioEl);
      this.remoteAudioElements.set(peerIdentityHex, audioEl);
    }
    audioEl.srcObject = stream;

    if (this.audioContext) {
      const source = this.audioContext.createMediaStreamSource(stream);
      const analyser = this.audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      this.analyserNodes.set(peerIdentityHex, analyser);
    }
  }

  removeRemoteStream(peerIdentityHex: string): void {
    const audioEl = this.remoteAudioElements.get(peerIdentityHex);
    if (audioEl) {
      audioEl.srcObject = null;
      audioEl.remove();
      this.remoteAudioElements.delete(peerIdentityHex);
    }
    this.analyserNodes.delete(peerIdentityHex);
    this.smoothedVolumes.delete(peerIdentityHex);
  }

  setPeerMuted(peerIdentityHex: string, isMuted: boolean): void {
    const audioEl = this.remoteAudioElements.get(peerIdentityHex);
    if (audioEl) {
      audioEl.muted = isMuted;
    }
  }

  onSpeakingStateChange(callback: (peerIdentityHex: string, isSpeaking: boolean) => void): void {
    this.onSpeakingChange = callback;
  }

  onLocalSpeakingChange(callback: (isSpeaking: boolean) => void): void {
    this.localSpeakingCallback = callback;
  }

  private startVADLoop(): void {
    if (this.vadIntervalId) return;

    let localWasSpeaking = false;
    const peerWasSpeaking = new Map<string, boolean>();

    this.vadIntervalId = setInterval(() => {
      // Check local speaking
      if (this.localAnalyser && this.localSpeakingCallback) {
        const volume = this.getAnalyserVolume(this.localAnalyser, '__local__');
        const isSpeaking = volume > VAD_THRESHOLD;
        if (isSpeaking !== localWasSpeaking) {
          localWasSpeaking = isSpeaking;
          this.localSpeakingCallback(isSpeaking);
        }
      }

      // Check remote peers speaking
      if (this.onSpeakingChange) {
        for (const [peerHex, analyser] of this.analyserNodes) {
          const volume = this.getAnalyserVolume(analyser, peerHex);
          const isSpeaking = volume > VAD_THRESHOLD;
          const wasSpeaking = peerWasSpeaking.get(peerHex) ?? false;
          if (isSpeaking !== wasSpeaking) {
            peerWasSpeaking.set(peerHex, isSpeaking);
            this.onSpeakingChange(peerHex, isSpeaking);
          }
        }
      }
    }, 100);
  }

  private getAnalyserVolume(analyser: AnalyserNode, key: string): number {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const rawVolume = sum / dataArray.length / 255;

    const prev = this.smoothedVolumes.get(key) ?? 0;
    const smoothed = prev * VAD_SMOOTHING + rawVolume * (1 - VAD_SMOOTHING);
    this.smoothedVolumes.set(key, smoothed);
    return smoothed;
  }

  destroy(): void {
    if (this.vadIntervalId) {
      clearInterval(this.vadIntervalId);
      this.vadIntervalId = null;
    }

    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        track.stop();
      }
      this.localStream = null;
    }

    for (const [peerHex] of this.remoteAudioElements) {
      this.removeRemoteStream(peerHex);
    }

    this.analyserNodes.clear();
    this.smoothedVolumes.clear();
    this.localAnalyser = null;

    if (this.audioContext) {
      void this.audioContext.close();
      this.audioContext = null;
    }

    this.onSpeakingChange = null;
    this.localSpeakingCallback = null;
  }
}
