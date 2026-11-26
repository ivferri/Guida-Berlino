let itineraryDays = [];
let currentDay = null;
let currentPOI = null;
let currentPOIs = [];

document.addEventListener('DOMContentLoaded', loadItineraries);

async function loadItineraries() {
  const container = document.getElementById('days');
  try {
    const response = await fetch('data/itineraries.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
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
  container.innerHTML = enabledDays.map(day => `
    <button type="button" class="day-card" onclick="openDay(${Number(day.id)})">
      <span class="day-date">${escapeHTML(day.date || '')}</span>
      <span class="day-card-title">${escapeHTML(day.title || `Giorno ${day.id}`)}</span>
      <span class="day-card-description">${escapeHTML(day.subtitle || day.description || 'Itinerario in preparazione')}</span>
      <span class="day-card-link">Esplora itinerario →</span>
    </button>
  `).join('');
}

async function openDay(id) {
  const day = itineraryDays.find(item => Number(item.id) === Number(id));
  if (!day) return;
  stopGPS();
  stopPOIAudio();
  try {
    const response = await fetch(day.dataFile);
    if (!response.ok) throw new Error(`File itinerario non trovato: ${day.dataFile}`);
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
    document.getElementById('dayTitle').textContent = data.title || day.title || `Giorno ${day.id}`;
    document.getElementById('dayDescription').textContent = data.description || data.subtitle || day.description || day.subtitle || '';
    document.getElementById('gpsStatus').textContent = 'GPS non attivo';
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
  container.innerHTML = currentPOIs.map((poi, index) => `
    <article class="day-card poi-card">
      <span class="day-date">TAPPA ${index + 1}</span>
      <span class="day-card-title">${escapeHTML(poi.name || `Tappa ${index + 1}`)}</span>
      <span class="day-card-description">${escapeHTML(poi.shortDescription || '')}</span>
      <button type="button" onclick="openPOI(${index})">Scopri questa tappa →</button>
    </article>
  `).join('');
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
  setOptionalText('poiChildrenText', currentPOI.childrenText, true);
  setOptionalText('poiNotes', currentPOI.notes, true);
  setPOIImage(currentPOI.image);

  const audioFile = currentPOI.audio || currentPOI.audioFile || (description && description.audioFile);
  document.getElementById('playRecordingButton').hidden = !(typeof audioFile === 'string' && audioFile.trim());
  const audioText = currentPOI.audioText || (description && description.audioText) || descriptionText;
  document.getElementById('playTextButton').hidden = !(typeof audioText === 'string' && audioText.trim());
  document.getElementById('audioStatus').textContent = 'Audioguida pronta';
  window.scrollTo(0, 0);
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

function setPOIImage(value) {
  const container = document.getElementById('poiImageSection');
  const image = document.getElementById('poiImage');
  if (!container || !image) return;
  const source = typeof value === 'string' ? value.trim() : '';
  if (!source) {
    image.removeAttribute('src');
    container.hidden = true;
    return;
  }
  try {
    const url = new URL(source, document.baseURI);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Protocollo immagine non consentito');
    image.src = url.href;
    image.alt = currentPOI.name ? `Immagine di ${currentPOI.name}` : 'Immagine della tappa';
    container.hidden = false;
    image.onerror = () => { container.hidden = true; };
  } catch (error) {
    console.warn('Percorso immagine POI non valido:', source);
    container.hidden = true;
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
