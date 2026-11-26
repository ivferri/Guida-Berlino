/* Gestione audioguide: sintesi vocale e file audio MP3. */
const BerlinAudio = {
  player: new Audio(),
  currentMode: null,
  currentUtterance: null,
  readText(text, language = 'it-IT', speed = 0.9) {
    this.stop();
    if (!text || !String(text).trim()) {
      this.updateStatus('Nessun testo disponibile');
      return;
    }
    if (!('speechSynthesis' in window)) {
      this.updateStatus('Sintesi vocale non supportata');
      return;
    }
    this.currentMode = 'text';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = speed;
    utterance.onstart = () => this.updateStatus('Lettura in corso');
    utterance.onend = () => this.updateStatus('Lettura completata');
    utterance.onerror = event => {
      if (event.error !== 'canceled' && event.error !== 'interrupted') this.updateStatus('Errore durante la lettura');
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
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.player.onended = null;
    this.player.onerror = null;
    this.player.pause();
    this.player.removeAttribute('src');
    this.player.load();
    this.currentMode = null;
    this.currentUtterance = null;
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
    Number(currentPOI.audioSpeed ?? settings.speed ?? 0.9));
}
function playPOIRecording() {
  if (!currentPOI) return;
  const description = currentPOI.description;
  BerlinAudio.playFile(currentPOI.audio || currentPOI.audioFile || (description && description.audioFile));
}
function pausePOIAudio() { BerlinAudio.pauseText(); }
function resumePOIAudio() { BerlinAudio.resumeText(); }
function stopPOIAudio() { BerlinAudio.stop(); }
