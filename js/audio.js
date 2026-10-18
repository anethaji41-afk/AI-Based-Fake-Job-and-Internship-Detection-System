/**
 * SENTINELGUARD AI - SYNTHESIZED WEB AUDIO & AI VOICE ASSISTANT
 * Uses Web Audio API for zero-dependency cybernetic audio FX
 * Uses Web Speech API for voice recognition & speech synthesis
 */

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) {
      if (this.isMuted) {
        btn.classList.add('muted');
        app.showToast('Cyber audio muted', 'info');
      } else {
        btn.classList.remove('muted');
        this.playBeep(880, 0.08, 'sine');
        app.showToast('Cyber audio activated', 'info');
      }
    }
  }

  // Pure Web Audio API Tone Synthesizer
  playTone(freq = 440, duration = 0.1, type = 'sine', gainVal = 0.15) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  playBeep(freq = 600, duration = 0.05, type = 'sine') {
    this.playTone(freq, duration, type, 0.12);
  }

  playScanStart() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playSafeChime() {
    if (this.isMuted) return;
    setTimeout(() => this.playTone(523.25, 0.15, 'triangle', 0.2), 0); // C5
    setTimeout(() => this.playTone(659.25, 0.2, 'triangle', 0.2), 120); // E5
    setTimeout(() => this.playTone(783.99, 0.35, 'triangle', 0.25), 240); // G5
  }

  playWarningAlert() {
    if (this.isMuted) return;
    this.playTone(440, 0.15, 'square', 0.18);
    setTimeout(() => this.playTone(392, 0.2, 'square', 0.18), 160);
  }

  playDangerAlarm() {
    if (this.isMuted) return;
    this.playTone(220, 0.25, 'sawtooth', 0.25);
    setTimeout(() => this.playTone(180, 0.35, 'sawtooth', 0.3), 200);
    setTimeout(() => this.playTone(140, 0.45, 'sawtooth', 0.3), 420);
  }
}

// Global Voice Assistant Controller using Web Speech API
class VoiceAssistant {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isDictating = false;
    this.synth = window.speechSynthesis || null;
    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.updateStatus(true);
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim().toLowerCase();
        console.log('Voice recognized:', transcript);
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        this.updateStatus(false);
        if (event.error === 'not-allowed') {
          app.showToast('Microphone access denied', 'error');
        }
      };

      this.recognition.onend = () => {
        this.updateStatus(false);
      };
    } else {
      console.log('Web Speech Recognition API not supported in this browser.');
    }
  }

  toggleListening() {
    audioEngine.init();
    if (!this.recognition) {
      app.showToast('Voice Recognition requires Chrome or Edge browser', 'error');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.updateStatus(false);
      app.showToast('AI Voice Assistant paused', 'info');
    } else {
      try {
        this.isDictating = false;
        this.recognition.start();
        this.updateStatus(true);
        audioEngine.playBeep(900, 0.1);
        app.showToast('Listening... Say "Analyze", "Scam", or "Clear"', 'info');
      } catch (err) {
        console.error('Recognition start error:', err);
      }
    }
  }

  startDictation() {
    audioEngine.init();
    if (!this.recognition) {
      app.showToast('Voice dictation requires Chrome/Edge speech API', 'error');
      return;
    }
    this.isDictating = true;
    try {
      this.recognition.start();
      this.updateStatus(true);
      const dictLabel = document.getElementById('dictation-btn-label');
      if (dictLabel) dictLabel.textContent = 'Listening...';
      app.showToast('Dictating: Speak the job description clearly...', 'info');
    } catch (e) {
      console.warn(e);
    }
  }

  updateStatus(active) {
    this.isListening = active;
    const btn = document.getElementById('voice-assistant-btn');
    const statusText = document.getElementById('voice-status-text');
    const dictLabel = document.getElementById('dictation-btn-label');

    if (btn) {
      if (active) {
        btn.classList.add('listening');
        if (statusText) statusText.textContent = 'Listening...';
      } else {
        btn.classList.remove('listening');
        if (statusText) statusText.textContent = 'AI Voice Ready';
        if (dictLabel) dictLabel.textContent = 'Voice Dictate';
      }
    }
  }

  processVoiceCommand(transcript) {
    if (this.isDictating) {
      const descInput = document.getElementById('input-description');
      if (descInput) {
        descInput.value = (descInput.value + ' ' + transcript).trim();
        app.updateCharCount(descInput);
        app.showToast('Dictation appended to description!', 'success');
        audioEngine.playBeep(750, 0.1);
      }
      this.isDictating = false;
      return;
    }

    // Voice Command Dispatcher
    if (transcript.includes('analyze') || transcript.includes('check') || transcript.includes('scan')) {
      audioEngine.playBeep(1000, 0.12);
      app.showToast('Voice Command: Executing Analysis', 'info');
      const submitBtn = document.getElementById('analyze-submit-button');
      if (submitBtn) submitBtn.click();
    } else if (transcript.includes('scam') || transcript.includes('telegram') || transcript.includes('fake')) {
      audioEngine.playBeep(850, 0.1);
      app.showToast('Voice Command: Loading Scam Preset', 'info');
      app.loadPreset('scam_telegram');
    } else if (transcript.includes('legit') || transcript.includes('safe') || transcript.includes('real')) {
      audioEngine.playBeep(850, 0.1);
      app.showToast('Voice Command: Loading Safe Preset', 'info');
      app.loadPreset('safe_corporate');
    } else if (transcript.includes('clear')) {
      audioEngine.playBeep(600, 0.1);
      app.showToast('Voice Command: Clearing Form', 'info');
      app.clearAnalysisForm();
    } else if (transcript.includes('read') || transcript.includes('speak') || transcript.includes('verdict')) {
      this.speakAssessment();
    } else {
      app.showToast(`Command not recognized: "${transcript}"`, 'info');
    }
  }

  // AI Speech Synthesis (Text-to-Speech)
  speakAssessment() {
    if (!this.synth) {
      app.showToast('Text to Speech is not supported on this browser', 'error');
      return;
    }

    if (this.synth.speaking) {
      this.synth.cancel();
      app.showToast('AI Voice Speech stopped', 'info');
      return;
    }

    const score = document.getElementById('gauge-score-value')?.textContent || '0';
    const tier = document.getElementById('risk-tier-badge')?.textContent || 'Pending';
    const headline = document.getElementById('risk-headline')?.textContent || '';
    const summary = document.getElementById('risk-executive-summary')?.textContent || '';

    const textToSpeak = `SentinelGuard Decision Support Report. Risk score is ${score} out of 100, categorized as ${tier}. ${headline}. Summary: ${summary}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Pick a natural English voice if available
    const voices = this.synth.getVoices();
    const techVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Zira') || v.name.includes('David')));
    if (techVoice) {
      utterance.voice = techVoice;
    }

    utterance.onstart = () => {
      app.showToast('AI Assistant speaking report...', 'info');
    };

    utterance.onend = () => {
      console.log('Voice finished speaking.');
    };

    this.synth.speak(utterance);
  }
}

// Instantiate Global Engines
const audioEngine = new AudioEngine();
const voiceAssistant = new VoiceAssistant();
