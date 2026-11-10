/* ==========================================================================
   10s Life Support Hero - Arcade Reflex Game Engine & Sound Synthesizer
   ========================================================================== */

class LifeSupportArcade {
  constructor() {
    // Game Mission State
    this.timerMax = 10.0;
    this.timeLeft = 10.0;
    this.timerInterval = null;
    this.isPlaying = false;
    this.currentStep = 1; // 1 to 5 steps
    this.totalSteps = 5;
    this.startTime = 0;
    this.elapsedTime = 0;

    // Scores & Streaks
    this.score = 0;
    this.streak = 0;
    this.highScore = parseInt(localStorage.getItem('ls_high_score') || '0', 10);

    // Audio Synth State
    this.soundEnabled = true;
    this.audioCtx = null;

    // CPR Slammer State
    this.isCprActive = false;
    this.cprInterval = null;
    this.cprBpm = 110;
    this.cprBeats = 0;
    this.lastBeatTime = 0;

    this.cacheDom();
    this.initScores();
    this.bindEvents();
    this.renderTimer();
  }

  cacheDom() {
    // Header & Score elements
    this.scoreValEl = document.getElementById('scoreVal');
    this.highScoreValEl = document.getElementById('highScoreVal');
    this.streakValEl = document.getElementById('streakVal');
    this.soundToggleBtn = document.getElementById('soundToggleBtn');
    this.soundIcon = document.getElementById('soundIcon');

    // Timer elements
    this.bigTimerText = document.getElementById('bigTimerText');
    this.timerProgressRing = document.getElementById('timerProgressRing');
    this.timerMeterFill = document.getElementById('timerMeterFill');

    // Monitor elements
    this.patientAvatar = document.getElementById('patientAvatar');
    this.statusBubble = document.getElementById('statusBubble');
    this.currentCueText = document.getElementById('currentCueText');
    this.bpmDisplay = document.getElementById('bpmDisplay');
    this.ecgPath = document.getElementById('ecgPath');

    // Steps container & tiles
    this.stepTiles = document.querySelectorAll('.step-tile');

    // Controls
    this.startPlayBtn = document.getElementById('startPlayBtn');
    this.cprModeBtn = document.getElementById('cprModeBtn');
    this.resetGameBtn = document.getElementById('resetGameBtn');

    // CPR Pad elements
    this.compressionPadBtn = document.getElementById('compressionPadBtn');
    this.padCounterText = document.getElementById('padCounterText');
    this.metronomePulse = document.getElementById('metronomePulse');
    this.beatRating = document.getElementById('beatRating');

    // Results Modal
    this.resultsModal = document.getElementById('resultsModal');
    this.modalEmoji = document.getElementById('modalEmoji');
    this.modalHeading = document.getElementById('modalHeading');
    this.modalSubtext = document.getElementById('modalSubtext');
    this.modalTimeVal = document.getElementById('modalTimeVal');
    this.modalScoreVal = document.getElementById('modalScoreVal');
    this.modalAccVal = document.getElementById('modalAccVal');
    this.modalRibbon = document.getElementById('modalRibbon');
    this.modalPlayAgainBtn = document.getElementById('modalPlayAgainBtn');
    this.modalCloseBtn = document.getElementById('modalCloseBtn');
  }

  initScores() {
    this.highScoreValEl.textContent = String(this.highScore).padStart(4, '0');
    this.scoreValEl.textContent = '0000';
    this.streakValEl.textContent = 'x0 🔥';
  }

  bindEvents() {
    // Start button
    this.startPlayBtn.addEventListener('click', () => {
      this.playChunkyClick();
      if (!this.isPlaying) {
        this.startMission();
      } else {
        this.resetGame();
      }
    });

    // Reset button
    this.resetGameBtn.addEventListener('click', () => {
      this.playChunkyClick();
      this.resetGame();
    });

    // Sound toggle
    this.soundToggleBtn.addEventListener('click', () => {
      this.soundEnabled = !this.soundEnabled;
      this.soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
      if (this.soundEnabled) this.playTone(523, 0.1, 'sine');
    });

    // Step tile reflex clicks
    this.stepTiles.forEach((tile) => {
      tile.addEventListener('click', (e) => {
        const stepNum = parseInt(tile.getAttribute('data-step'), 10);
        this.handleTileClick(stepNum, tile);
      });
    });

    // CPR Mode button
    this.cprModeBtn.addEventListener('click', () => {
      this.playChunkyClick();
      this.toggleCprMetronome();
    });

    // CPR Compression Pad button
    this.compressionPadBtn.addEventListener('click', () => {
      this.handleChestCompression();
    });

    // Modal buttons
    this.modalPlayAgainBtn.addEventListener('click', () => {
      this.playChunkyClick();
      this.closeModal();
      this.startMission();
    });

    this.modalCloseBtn.addEventListener('click', () => {
      this.playChunkyClick();
      this.closeModal();
    });
  }

  /* ==========================================================================
     Chunky Sound Synthesis (Web Audio API)
     ========================================================================== */

  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, duration = 0.1, type = 'sine', gainVal = 0.2) {
    if (!this.soundEnabled) return;
    try {
      this.initAudio();
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
      console.warn('Audio play prevented:', e);
    }
  }

  playChunkyClick() {
    this.playTone(280, 0.06, 'triangle', 0.25);
  }

  playSuccessChime(step) {
    const scale = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C, E, G
    const freq = scale[step - 1] || 523.25;
    this.playTone(freq, 0.18, 'square', 0.2);
  }

  playMissBuzz() {
    this.playTone(130, 0.25, 'sawtooth', 0.3);
  }

  playVictoryFanfare() {
    if (!this.soundEnabled) return;
    const notes = [
      { f: 523, d: 0.12 },
      { f: 659, d: 0.12 },
      { f: 783, d: 0.15 },
      { f: 1046, d: 0.4 }
    ];
    let time = 0;
    notes.forEach((n) => {
      setTimeout(() => this.playTone(n.f, n.d, 'triangle', 0.35), time * 1000);
      time += n.d;
    });
  }

  /* ==========================================================================
     Game Mission Logic
     ========================================================================== */

  startMission() {
    this.initAudio();
    this.resetBoardState();
    this.isPlaying = true;
    this.startTime = performance.now();
    this.timeLeft = this.timerMax;
    this.currentStep = 1;

    // Update buttons
    this.startPlayBtn.classList.remove('chunky-green');
    this.startPlayBtn.classList.add('chunky-orange');
    this.startPlayBtn.querySelector('.btn-text').textContent = 'ABORT MISSION';
    this.startPlayBtn.querySelector('.btn-icon').textContent = '⏹';

    // Vitals Screen Setup
    this.patientAvatar.textContent = '😵';
    this.patientAvatar.classList.remove('revived');
    this.statusBubble.textContent = 'CHECKING VITALS!';
    this.statusBubble.style.background = '#ef4444';
    this.bpmDisplay.textContent = '0 BPM';
    this.ecgPath.style.stroke = '#ef4444';

    // Highlight initial step
    this.highlightActiveStep(1);

    // Start 10s timer loop
    const tickRate = 50; // ms
    this.timerInterval = setInterval(() => {
      this.timeLeft = Math.max(0, this.timeLeft - (tickRate / 1000));
      this.renderTimer();

      // Countdown audio tension in final 3 seconds
      if (this.timeLeft <= 3.0 && this.timeLeft > 0) {
        if (Math.abs((this.timeLeft % 1) - 0.9) < 0.05) {
          this.playTone(750, 0.05, 'square', 0.15);
        }
      }

      if (this.timeLeft <= 0) {
        this.handleTimeExpired();
      }
    }, tickRate);
  }

  highlightActiveStep(stepIndex) {
    this.stepTiles.forEach((tile) => {
      const step = parseInt(tile.getAttribute('data-step'), 10);
      if (step === stepIndex) {
        tile.classList.add('target-active');
      } else {
        tile.classList.remove('target-active');
      }
    });

    // Provide friendly instruction cue
    const cues = [
      "1️⃣ Look around: Is the scene safe to approach?!",
      "2️⃣ Tap the shoulders & SHOUT: 'Can you hear me?!'",
      "3️⃣ Tilt head & lift chin to open the airway!",
      "4️⃣ Look at chest for rise & listen for normal breathing!",
      "5️⃣ Feel the carotid artery (Max 10 seconds total)!"
    ];
    this.currentCueText.innerHTML = `<strong>TARGET:</strong> ${cues[stepIndex - 1]}`;
  }

  handleTileClick(stepNum, tileEl) {
    if (!this.isPlaying) {
      // Allow user to explore sound & animations even before starting!
      this.playChunkyClick();
      tileEl.classList.toggle('completed');
      return;
    }

    if (stepNum === this.currentStep) {
      // Correct step hit!
      this.playSuccessChime(this.currentStep);
      tileEl.classList.remove('target-active');
      tileEl.classList.add('completed');

      // Add points
      const stepBonus = 150 + Math.round(this.timeLeft * 30);
      this.addScore(stepBonus);

      this.currentStep++;

      if (this.currentStep <= this.totalSteps) {
        this.highlightActiveStep(this.currentStep);
      } else {
        // ALL 5 STEPS COMPLETED IN UNDER 10 SECONDS! VICTORY!
        this.handleVictory();
      }
    } else if (stepNum > this.currentStep) {
      // Clicked out of sequence! Small penalty / cue
      this.playMissBuzz();
      this.currentCueText.innerHTML = `⚠️ <strong>Out of order!</strong> Follow Step 0${this.currentStep} first!`;
    }
  }

  handleVictory() {
    clearInterval(this.timerInterval);
    this.isPlaying = false;
    this.elapsedTime = ((performance.now() - this.startTime) / 1000).toFixed(1);

    // Patient saved visuals!
    this.patientAvatar.textContent = '🥳';
    this.patientAvatar.classList.add('revived');
    this.statusBubble.textContent = 'SAVED & STABLE!';
    this.statusBubble.style.background = '#22c55e';
    this.bpmDisplay.textContent = '76 BPM';
    this.ecgPath.style.stroke = '#22c55e';

    // Boost streak
    this.streak++;
    this.streakValEl.textContent = `x${this.streak} 🔥`;

    // Completion score bonus
    const speedBonus = Math.round(this.timeLeft * 100);
    this.addScore(speedBonus);

    // Confetti explosion!
    this.fireConfetti();
    this.playVictoryFanfare();

    // Show victory modal
    setTimeout(() => {
      this.showResultsModal(true, this.elapsedTime, speedBonus);
    }, 600);
  }

  handleTimeExpired() {
    clearInterval(this.timerInterval);
    this.isPlaying = false;
    this.timeLeft = 0;
    this.renderTimer();

    this.playMissBuzz();
    this.streak = 0;
    this.streakValEl.textContent = 'x0 🔥';

    // Patient critical alert
    this.patientAvatar.textContent = '💔';
    this.statusBubble.textContent = 'TIME EXPIRED (>10s)!';
    this.statusBubble.style.background = '#ef4444';
    this.currentCueText.innerHTML = `🚨 <strong>Over 10 seconds!</strong> Never delay CPR if unsure!`;

    setTimeout(() => {
      this.showResultsModal(false, '10.0+', 0);
    }, 500);
  }

  addScore(points) {
    this.score += points;
    this.scoreValEl.textContent = String(this.score).padStart(4, '0');
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.highScoreValEl.textContent = String(this.highScore).padStart(4, '0');
      localStorage.setItem('ls_high_score', String(this.highScore));
    }
  }

  renderTimer() {
    this.bigTimerText.textContent = this.timeLeft.toFixed(1);

    const circumference = 314.15; // 2 * PI * 50
    const ratio = this.timeLeft / this.timerMax;
    const offset = circumference * (1 - ratio);
    this.timerProgressRing.style.strokeDashoffset = offset;

    // Meter bar width
    this.timerMeterFill.style.width = `${ratio * 100}%`;

    // Dynamic color shifting
    if (this.timeLeft > 5.0) {
      this.timerProgressRing.style.stroke = '#38bdf8';
      this.timerMeterFill.style.background = 'linear-gradient(90deg, #22c55e, #38bdf8)';
    } else if (this.timeLeft > 2.5) {
      this.timerProgressRing.style.stroke = '#facc15';
      this.timerMeterFill.style.background = 'linear-gradient(90deg, #facc15, #f97316)';
    } else {
      this.timerProgressRing.style.stroke = '#ef4444';
      this.timerMeterFill.style.background = '#ef4444';
    }
  }

  /* ==========================================================================
     CPR Metronome & Chest Slammer Pad
     ========================================================================== */

  toggleCprMetronome() {
    if (this.isCprActive) {
      this.stopCprMetronome();
    } else {
      this.startCprMetronome();
    }
  }

  startCprMetronome() {
    this.initAudio();
    this.isCprActive = true;
    this.cprBeats = 0;
    this.padCounterText.textContent = '0 / 30';
    this.beatRating.textContent = 'KEEP PACE';
    this.beatRating.className = 'beat-accuracy-badge';

    this.cprModeBtn.classList.remove('chunky-orange');
    this.cprModeBtn.classList.add('chunky-blue');
    this.cprModeBtn.querySelector('.btn-text').textContent = 'STOP CPR PACER';

    const intervalMs = (60 / this.cprBpm) * 1000; // ~545ms

    this.cprInterval = setInterval(() => {
      this.lastBeatTime = performance.now();
      // Pulsate heart icon
      this.metronomePulse.classList.add('beat');
      setTimeout(() => this.metronomePulse.classList.remove('beat'), 140);

      // Metronome audio tick
      this.playTone(600, 0.04, 'sine', 0.15);
    }, intervalMs);
  }

  stopCprMetronome() {
    this.isCprActive = false;
    clearInterval(this.cprInterval);
    this.cprModeBtn.classList.remove('chunky-blue');
    this.cprModeBtn.classList.add('chunky-orange');
    this.cprModeBtn.querySelector('.btn-text').textContent = 'CPR RHYTHM METRONOME';
    this.beatRating.textContent = 'READY';
    this.beatRating.className = 'beat-accuracy-badge';
  }

  handleChestCompression() {
    this.initAudio();
    this.cprBeats++;
    this.padCounterText.textContent = `${this.cprBeats} / 30`;

    // Visual button slam animation
    this.compressionPadBtn.classList.add('slammed');
    setTimeout(() => this.compressionPadBtn.classList.remove('slammed'), 100);

    // Accuracy check against 110 BPM beat
    if (this.isCprActive) {
      const now = performance.now();
      const delta = Math.abs(now - this.lastBeatTime);
      if (delta < 150) {
        this.beatRating.textContent = 'PERFECT! 🎯';
        this.beatRating.className = 'beat-accuracy-badge perfect';
        this.addScore(25);
      } else {
        this.beatRating.textContent = 'OFF BEAT';
        this.beatRating.className = 'beat-accuracy-badge miss';
      }
    }

    if (this.cprBeats % 30 === 0) {
      // 30 compressions reached: time for 2 rescue breaths!
      this.playTone(880, 0.25, 'triangle', 0.3);
      this.fireConfetti();
      this.beatRating.textContent = 'GIVE 2 BREATHS! 💨';
      this.beatRating.className = 'beat-accuracy-badge perfect';
    } else {
      this.playTone(180, 0.06, 'square', 0.2);
    }
  }

  /* ==========================================================================
     Confetti Celebrations & Modal Presentation
     ========================================================================== */

  fireConfetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#22c55e', '#facc15', '#38bdf8', '#f43f5e', '#a855f7']
      });

      // Extra secondary burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    }
  }

  showResultsModal(isWin, timeStr, bonusScore) {
    if (isWin) {
      this.modalRibbon.textContent = 'MISSION ACCOMPLISHED! ⭐';
      this.modalRibbon.style.background = '#facc15';
      this.modalEmoji.textContent = '🏆';
      this.modalHeading.textContent = 'ARCADE LIFESAVER MASTER!';
      this.modalSubtext.textContent = `Rapid reflex triage completed in ${timeStr} seconds! Safe, systematic and decisive.`;
      this.modalTimeVal.textContent = `${timeStr}s`;
      this.modalScoreVal.textContent = `+${bonusScore}`;
      this.modalAccVal.textContent = '100%';
    } else {
      this.modalRibbon.textContent = 'TIME EXPIRED (> 10s) ⚠️';
      this.modalRibbon.style.background = '#ef4444';
      this.modalEmoji.textContent = '⏱️';
      this.modalHeading.textContent = 'TOO SLOW - CPR NEEDED!';
      this.modalSubtext.textContent = 'Remember the Golden Rule: If you cannot confirm breathing & pulse within 10s, begin compressions immediately!';
      this.modalTimeVal.textContent = '>10.0s';
      this.modalScoreVal.textContent = '+0';
      this.modalAccVal.textContent = 'RETRY';
    }

    this.resultsModal.classList.add('open');
  }

  closeModal() {
    this.resultsModal.classList.remove('open');
  }

  resetBoardState() {
    clearInterval(this.timerInterval);
    this.isPlaying = false;
    this.timeLeft = this.timerMax;
    this.currentStep = 1;
    this.renderTimer();

    this.startPlayBtn.classList.remove('chunky-orange');
    this.startPlayBtn.classList.add('chunky-green');
    this.startPlayBtn.querySelector('.btn-text').textContent = 'START 10s MISSION';
    this.startPlayBtn.querySelector('.btn-icon').textContent = '🚀';

    this.stepTiles.forEach((tile) => {
      tile.classList.remove('completed', 'target-active');
    });

    this.patientAvatar.textContent = '😵';
    this.patientAvatar.classList.remove('revived');
    this.statusBubble.textContent = 'UNRESPONSIVE!';
    this.statusBubble.style.background = '#ef4444';
    this.bpmDisplay.textContent = '0 BPM';
    this.ecgPath.style.stroke = '#ef4444';
    this.currentCueText.innerHTML = `Press <strong>"START MISSION"</strong> to begin 10-second life assessment!`;
  }

  resetGame() {
    this.resetBoardState();
    this.stopCprMetronome();
    this.cprBeats = 0;
    this.padCounterText.textContent = '0 / 30';
  }
}

// Auto-boot game
document.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new LifeSupportArcade();
});
