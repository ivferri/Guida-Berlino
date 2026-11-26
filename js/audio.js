/* Sintesi vocale ottimizzata per Android/Chrome e riproduzione di file audio. */
const BerlinAudio = {
  player: new Audio(),
  currentMode: null,
  currentUtterance: null,
  queue: [],
  queueIndex: 0,
  queueTimer: null,

  readText(text, language = 'it-IT', speed = 1) {
    this.stop();
    const cleanText = String(text || '').replace(/\r\n?/g, '\n').trim();
    if (!cleanText) {
      this.updateStatus('Nessun testo disponibile');
      return;
    }
    if (!('speechSynthesis' in window)) {
      this.updateStatus('Sintesi vocale non supportata');
      return;
    }

    this.currentMode = 'text';
    this.language = language || 'it-IT';
    this.rate = Math.min(1.15, Math.max(0.85, Number(speed) || 1));
    this.queue = this.splitIntoChunks(cleanText);
    this.queueIndex = 0;

    // Su Android l'elenco delle voci può arrivare qualche istante dopo l'apertura della PWA.
    const startWhenReady = () => {
      if (this.currentMode !== 'text') return;
      const voices = window.speechSynthesis.getVoices();
      this.voice = this.selectItalianVoice(voices, this.language);
      this.speakNext();
    };
    if (window.speechSynthesis.getVoices().length) {
      startWhenReady();
    } else {
      this.updateStatus('Preparazione della voce italiana…');
      let started = false;
      const startOnce = () => {
        if (started || this.currentMode !== 'text') return;
        started = true;
        window.speechSynthesis.removeEventListener?.('voiceschanged', startOnce);
        startWhenReady();
      };
      window.speechSynthesis.addEventListener?.('voiceschanged', startOnce, { once: true });
      window.setTimeout(startOnce, 700);
    }
  },

  selectItalianVoice(voices, language) {
    const italian = voices.filter(voice => (voice.lang || '').toLowerCase().startsWith('it'));
    if (!italian.length) return null;
    const preferredLocale = String(language || 'it-IT').toLowerCase();
    return italian.sort((a, b) => {
      const score = voice => {
        let value = 0;
        const locale = (voice.lang || '').toLowerCase();
        const name = (voice.name || '').toLowerCase();
        if (locale === preferredLocale) value += 5;
        if (locale === 'it-it') value += 3;
        if (/google|natural|neural|premium/.test(name)) value += 4;
        if (voice.localService) value += 1;
        return value;
      };
      return score(b) - score(a);
    })[0];
  },

  splitIntoChunks(text) {
    // Conserva i paragrafi e i confini delle frasi: blocchi brevi rendono la lettura
    // più naturale e riducono le interruzioni che si verificano spesso su Android.
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    for (const paragraph of paragraphs) {
      const normalized = paragraph.replace(/\s+/g, ' ').trim();
      if (!normalized) continue;
      const sentences = normalized.match(/[^.!?…]+[.!?…]+[»”"')\]]*|[^.!?…]+$/g) || [normalized];
      let current = '';
      for (const sentence of sentences) {
        const part = sentence.trim();
        if (!part) continue;
        if (current && (current.length + part.length + 1 > 220)) {
          chunks.push(current);
          current = '';
        }
        if (part.length > 220) {
          if (current) chunks.push(current);
          current = '';
          const words = part.split(' ');
          let fragment = '';
          for (const word of words) {
            if (fragment && fragment.length + word.length + 1 > 220) {
              chunks.push(fragment);
              fragment = '';
            }
            fragment += (fragment ? ' ' : '') + word;
          }
          current = fragment;
        } else {
          current += (current ? ' ' : '') + part;
        }
      }
      if (current) chunks.push(current);
    }
    return chunks;
  },

  speakNext() {
    if (this.currentMode !== 'text') return;
    if (this.queueIndex >= this.queue.length) {
      this.currentMode = null;
      this.currentUtterance = null;
      this.updateStatus('Lettura completata');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(this.queue[this.queueIndex]);
    utterance.lang = this.language || 'it-IT';
    if (this.voice) utterance.voice = this.voice;
    utterance.rate = this.rate || 1;
    utterance.pitch = 1.04;
    utterance.onstart = () => this.updateStatus('Lettura in corso');
    utterance.onend = () => {
      if (this.currentMode !== 'text') return;
      this.queueIndex += 1;
      // Una breve pausa tra le frasi evita l'effetto di lettura continua e affrettata.
      this.queueTimer = window.setTimeout(() => this.speakNext(), 160);
    };
    utterance.onerror = event => {
      if (this.currentMode !== 'text') return;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      this.updateStatus('Errore durante la lettura');
      this.currentMode = null;
    };
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  },

  pauseText() {
    if (this.currentMode === 'text') {
      window.speechSynthesis.pause();
      this.updateStatus('Lettura in pausa');
    } else if (this.currentMode === 'file') this.pauseFile();
  },
  resumeText() {
    if (this.currentMode === 'text') {
      window.speechSynthesis.resume();
      this.updateStatus('Lettura in corso');
    } else if (this.currentMode === 'file') this.resumeFile();
  },
  async playFile(file) {
    if (typeof file !== 'string' || !file.trim()) {
      this.updateStatus('Registrazione non disponibile');
      return;
    }
    this.stop();
    this.currentMode = 'file';
    this.player.onended = () => {
      this.currentMode = null;
      this.updateStatus('Riproduzione completata');
    };
    this.player.onerror = () => {
      this.currentMode = null;
      this.updateStatus('File audio non disponibile');
    };
    this.player.src = file;
    this.player.load();
    this.updateStatus('Caricamento registrazione...');
    try {
      await this.player.play();
      if (this.currentMode === 'file') this.updateStatus('Riproduzione audio in corso');
    } catch (error) {
      this.currentMode = null;
      this.updateStatus('Impossibile riprodurre il file');
      console.error(error);
    }
  },
  pauseFile() {
    this.player.pause();
    this.updateStatus('Audio in pausa');
  },
  resumeFile() {
    this.player.play().then(() => this.updateStatus('Riproduzione audio in corso')).catch(error => {
      this.updateStatus('Impossibile riprendere la riproduzione');
      console.error(error);
    });
  },
  stop() {
    if (this.queueTimer) window.clearTimeout(this.queueTimer);
    this.queueTimer = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.player.onended = null;
    this.player.onerror = null;
    this.player.pause();
    this.player.removeAttribute('src');
    this.player.load();
    this.currentMode = null;
    this.currentUtterance = null;
    this.queue = [];
    this.queueIndex = 0;
    this.updateStatus('Audio fermato');
  },
  updateStatus(message) {
    const element = document.getElementById('audioStatus');
    if (element) element.textContent = message;
  }
};

function playPOIText() {
  if (!currentPOI) return;
  const description = currentPOI.description;
  const descriptionText = typeof description === 'string' ? description : (description && description.text) || '';
  const text = currentPOI.audioText || (description && description.audioText) || descriptionText;
  const settings = currentPOI.audioSettings || {};
  BerlinAudio.readText(text, currentPOI.audioLanguage || settings.language || 'it-IT',
    Number(currentPOI.audioSpeed ?? settings.speed ?? 1));
}
function playPOIRecording() {
  if (!currentPOI) return;
  const description = currentPOI.description;
  BerlinAudio.playFile(currentPOI.audio || currentPOI.audioFile || (description && description.audioFile));
}
function pausePOIAudio() { BerlinAudio.pauseText(); }
function resumePOIAudio() { BerlinAudio.resumeText(); }
function stopPOIAudio() { BerlinAudio.stop(); }
