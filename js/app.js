let itineraryDays = [];
let currentDay = null;
let currentPOI = null;
let currentPOIs = [];

document.addEventListener('DOMContentLoaded', loadItineraries);

async function loadItineraries() {
  const container = document.getElementById('days');
  try {
    const response = await fetch('data/itineraries.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    itineraryDays = Array.isArray(data.itineraries) ? data.itineraries : [];
    renderHome();
  } catch (error) {
    console.error('Errore caricamento itinerari:', error);
    container.innerHTML = '<p class="empty-state">Non è stato possibile caricare gli itinerari. Riprova quando la connessione è disponibile.</p>';
  }
}

function renderHome() {
  const container = document.getElementById('days');
  const enabledDays = itineraryDays.filter(day => day && day.enabled !== false);
  if (!enabledDays.length) {
    container.innerHTML = '<p class="empty-state">Gli itinerari non sono ancora disponibili.</p>';
    return;
  }
  container.innerHTML = enabledDays.map(day =>
    '<button type="button" class="day-card" onclick="openDay(' + Number(day.id) + ')">' +
      '<span class="day-date">' + escapeHTML(day.date || '') + '</span>' +
      '<span class="day-card-title">' + escapeHTML(day.title || ('Giorno ' + day.id)) + '</span>' +
      '<span class="day-card-description">' + escapeHTML(day.subtitle || day.description || 'Itinerario in preparazione') + '</span>' +
      '<span class="day-card-link">Esplora itinerario →</span>' +
    '</button>'
  ).join('');
}

async function openDay(id) {
  const day = itineraryDays.find(item => Number(item.id) === Number(id));
  if (!day) return;
  stopGPS();
  stopPOIAudio();
  try {
    const response = await fetch(day.dataFile);
    if (!response.ok) throw new Error('File itinerario non trovato: ' + day.dataFile);
    const data = await response.json();
    currentDay = day;
    currentPOIs = Array.isArray(data.pois)
      ? data.pois.filter(poi => poi && typeof poi === 'object' && !Array.isArray(poi))
      : [];
    if (Array.isArray(data.pois) && currentPOIs.length !== data.pois.length) {
      console.warn('Alcune tappe non valide sono state ignorate:', day.dataFile);
    }
    document.getElementById('home').hidden = true;
    document.getElementById('poiPage').hidden = true;
    document.getElementById('dayPage').hidden = false;
    document.getElementById('dayTitle').textContent = data.title || day.title || ('Giorno ' + day.id);
    document.getElementById('dayDescription').textContent = data.description || data.subtitle || day.description || day.subtitle || '';
    document.getElementById('gpsStatus').textContent = 'GPS non attivo';
    document.getElementById('offlineStatus').textContent = 'Scarica testi e audioguide per consultarli senza connessione.';
    renderPOIs();
    if (typeof initializeMap === 'function') initializeMap(currentPOIs, data.map || {});
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('Errore apertura itinerario:', error);
    alert('Non riesco a caricare questo itinerario. Verifica il file dati associato.');
  }
}

function renderPOIs() {
  const container = document.getElementById('poiList');
  if (!currentPOIs.length) {
    container.innerHTML = '<p class="empty-state">Le tappe di questa giornata verranno aggiunte prossimamente.</p>';
    return;
  }
  container.innerHTML = currentPOIs.map((poi, index) =>
    '<article class="day-card poi-card">' +
      '<span class="day-date">TAPPA ' + (index + 1) + '</span>' +
      '<span class="day-card-title">' + escapeHTML(poi.name || ('Tappa ' + (index + 1))) + '</span>' +
      '<span class="day-card-description">' + escapeHTML(poi.shortDescription || '') + '</span>' +
      '<button type="button" onclick="openPOI(' + index + ')">Scopri questa tappa →</button>' +
    '</article>'
  ).join('');
}

function openPOI(index) {
  currentPOI = currentPOIs[index];
  if (!currentPOI) return;
  stopPOIAudio();
  document.getElementById('dayPage').hidden = true;
  document.getElementById('poiPage').hidden = false;
  document.getElementById('poiTitle').textContent = currentPOI.name || 'Tappa';

  const description = currentPOI.description;
  const descriptionText = typeof description === 'string'
    ? description : (description && description.text) || '';
  setOptionalText('poiCategory', currentPOI.category);
  setOptionalText('poiDescription', descriptionText || currentPOI.shortDescription);
  setOptionalText('poiVisitDuration', currentPOI.visitDuration);
  setOptionalText('poiCuriosities', currentPOI.curiosities, true);
  setOptionalText('poiChildrenCuriosity', currentPOI.childrenCuriosity, true);
  setOptionalText('poiChildrenText', currentPOI.childrenText, true);
  setOptionalText('poiNotes', currentPOI.notes, true);

  const audioFile = getPOIAudioFile(currentPOI);
  document.getElementById('playRecordingButton').hidden = !(typeof audioFile === 'string' && audioFile.trim());
  const audioText = currentPOI.audioText || (description && description.audioText) || descriptionText;
  document.getElementById('playTextButton').hidden = !(typeof audioText === 'string' && audioText.trim());
  document.getElementById('audioStatus').textContent = 'Audioguida pronta';
  window.scrollTo(0, 0);
}

function getPOIAudioFile(poi) {
  const description = poi && poi.description;
  return poi && (poi.audio || poi.audioFile || (description && typeof description === 'object' && description.audioFile));
}

function setOptionalText(id, value, section = false) {
  const element = document.getElementById(id);
  if (!element) return;
  const text = typeof value === 'string' ? value.trim() : '';
  element.textContent = text;
  if (section) {
    const wrapper = document.getElementById(id + 'Section');
    if (wrapper) wrapper.hidden = !text;
  } else {
    element.hidden = !text;
  }
}

async function downloadDayOffline() {
  const button = document.getElementById('downloadDayButton');
  const status = document.getElementById('offlineStatus');
  if (!currentDay || !currentDay.dataFile) {
    status.textContent = 'Apri una giornata prima di avviare il download.';
    return;
  }
  if (!('serviceWorker' in navigator) || !('MessageChannel' in window)) {
    status.textContent = 'Il download offline non è supportato da questo browser.';
    return;
  }

  const resources = new Set();
  let skippedExternal = 0;
  let invalidPaths = 0;
  const addResource = rawPath => {
    if (typeof rawPath !== 'string' || !rawPath.trim()) return;
    try {
      const url = new URL(rawPath.trim(), document.baseURI);
      if (url.origin !== location.origin) {
        skippedExternal += 1;
        return;
      }
      resources.add(url.href);
    } catch (error) {
      invalidPaths += 1;
    }
  };

  addResource(currentDay.dataFile);
  currentPOIs.forEach(poi => addResource(getPOIAudioFile(poi)));

  button.disabled = true;
  button.textContent = 'Download in corso…';
  status.textContent = 'Preparazione dei contenuti…';

  try {
    const registration = await navigator.serviceWorker.ready;
    const worker = navigator.serviceWorker.controller || registration.active;
    if (!worker) throw new Error('Service Worker non attivo');

    const results = await new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timeout = window.setTimeout(() => reject(new Error('Tempo di download esaurito')), 180000);
      channel.port1.onmessage = event => {
        const data = event.data || {};
        if (data.type === 'progress') {
          status.textContent = 'Download contenuti: ' + data.completed + ' di ' + data.total + '…';
        } else if (data.type === 'complete') {
          window.clearTimeout(timeout);
          resolve(data.results || []);
        } else if (data.type === 'error') {
          window.clearTimeout(timeout);
          reject(new Error(data.message || 'Errore durante il download'));
        }
      };
      worker.postMessage({ type: 'CACHE_URLS', urls: Array.from(resources) }, [channel.port2]);
    });

    const successful = results.filter(item => item.ok).length;
    const failed = results.filter(item => !item.ok);
    let message = successful + ' di ' + resources.size + ' file disponibili offline.';
    if (!currentPOIs.some(poi => {
      const audio = getPOIAudioFile(poi);
      return typeof audio === 'string' && audio.trim();
    })) {
      message += ' Per ora questa giornata non contiene audioguide registrate.';
    }
    if (failed.length) message += ' Non scaricati: ' + failed.length + '.';
    if (skippedExternal) message += ' File su server esterni esclusi: ' + skippedExternal + '.';
    if (invalidPaths) message += ' Percorsi non validi: ' + invalidPaths + '.';
    status.textContent = message;
  } catch (error) {
    console.error('Errore download offline:', error);
    status.textContent = 'Download non completato: ' + error.message;
  } finally {
    button.disabled = false;
    button.textContent = '⬇ Scarica contenuti per uso offline';
  }
}

function showHome() {
  stopGPS();
  stopPOIAudio();
  currentPOI = null;
  currentDay = null;
  document.getElementById('dayPage').hidden = true;
  document.getElementById('poiPage').hidden = true;
  document.getElementById('home').hidden = false;
  window.scrollTo(0, 0);
}

function backToDay() {
  stopPOIAudio();
  document.getElementById('poiPage').hidden = true;
  document.getElementById('dayPage').hidden = false;
  if (typeof refreshMapSize === 'function') refreshMapSize();
  window.scrollTo(0, 0);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[char]);
}
