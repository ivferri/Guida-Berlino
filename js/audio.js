/*
 BERLIN 2.0
 Gestione audioguide

 Modalità principale: lettura testi (TTS)
 Modalità alternativa: file audio MP3
*/

const BerlinAudio = {

  player: new Audio(),
  currentMode: null,
  currentText: "",
  currentFile: "",
  currentUtterance: null,
  speed: 0.9,
  language: "it-IT",

  // LETTURA DEI TESTI

  readText(text, language = "it-IT", speed = 0.9) {
    this.stop();

    if (!text || !text.trim()) {
      this.updateStatus("Nessun testo disponibile");
      return;
    }

    if (!("speechSynthesis" in window)) {
      this.updateStatus("Sintesi vocale non supportata");
      return;
    }

    this.currentMode = "text";
    this.currentText = text;
    this.language = language;
    this.speed = speed;

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = language;
    utterance.rate = speed;

    utterance.onstart = () => {
      this.updateStatus("Lettura in corso");
    };

    utterance.onend = () => {
      this.updateStatus("Lettura completata");
    };

    utterance.onerror = (event) => {
      if (event.error !== "canceled" &&
          event.error !== "interrupted") {
        this.updateStatus("Errore durante la lettura");
      }
    };

    this.currentUtterance = utterance;

    window.speechSynthesis.speak(utterance);
  },

  pauseText() {
    if (this.currentMode === "text") {
      window.speechSynthesis.pause();
      this.updateStatus("Lettura in pausa");
    }
  },

  resumeText() {
    if (this.currentMode === "text") {
      window.speechSynthesis.resume();
      this.updateStatus("Lettura in corso");
    }
  },

  // RIPRODUZIONE FILE AUDIO

  async playFile(file) {
    if (!file) {
      this.updateStatus("Registrazione non disponibile");
      return;
    }

    this.stop();

    this.currentMode = "file";
    this.currentFile = file;
    this.player.src = file;
    this.player.load();

    try {
      await this.player.play();
      this.updateStatus("Riproduzione audio in corso");
    } catch (error) {
      this.updateStatus("Impossibile riprodurre il file");
      console.error(error);
    }
  },

  pauseFile() {
    this.player.pause();
    this.updateStatus("Audio in pausa");
  },

  resumeFile() {
    this.player.play();
    this.updateStatus("Riproduzione audio in corso");
  },

  // ARRESTO GENERALE

  stop() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    this.player.pause();
    this.player.currentTime = 0;

    this.currentMode = null;
    this.currentUtterance = null;

    this.updateStatus("Audio fermato");
  },

  // STATO AUDIO

  updateStatus(message) {
    const element = document.getElementById("audioStatus");

    if (element) {
      element.textContent = message;
    }
  }
};


// COLLEGAMENTO CON IL POI SELEZIONATO

function playPOIText() {
  if (!currentPOI) return;

  BerlinAudio.readText(
    currentPOI.audioText || currentPOI.description,
    currentPOI.audioLanguage || "it-IT",
    Number(currentPOI.audioSpeed ?? 0.9)
  );
}

function playPOIRecording() {
  if (!currentPOI) return;

  BerlinAudio.playFile(currentPOI.audio);
}

function pausePOIAudio() {
  if (BerlinAudio.currentMode === "text") {
    BerlinAudio.pauseText();
  } else {
    BerlinAudio.pauseFile();
  }
}

function resumePOIAudio() {
  if (BerlinAudio.currentMode === "text") {
    BerlinAudio.resumeText();
  } else {
    BerlinAudio.resumeFile();
  }
}

function stopPOIAudio() {
  BerlinAudio.stop();
}
