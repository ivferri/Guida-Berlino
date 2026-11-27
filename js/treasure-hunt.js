let treasureHuntData = null;
const TREASURE_PROGRESS_KEY = 'berlin-treasure-hunt-progress-v1';

async function loadTreasureHuntData() {
  if (treasureHuntData) return treasureHuntData;
  const response = await fetch('data/treasure-hunt.json');
  if (!response.ok) throw new Error('File della caccia al tesoro non disponibile');
  treasureHuntData = await response.json();
  return treasureHuntData;
}

function getTreasureProgress() {
  try {
    const saved = localStorage.getItem(TREASURE_PROGRESS_KEY);
    const parsed = saved ? JSON.parse(saved) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Progressi della caccia al tesoro non leggibili:', error);
    return {};
  }
}

function saveTreasureProgress(progress) {
  try {
    localStorage.setItem(TREASURE_PROGRESS_KEY, JSON.stringify(progress));
    return true;
  } catch (error) {
    console.error('Impossibile salvare i progressi della caccia:', error);
    return false;
  }
}

async function renderTreasureHunt(dayId) {
  const panel = document.getElementById('treasureHuntPanel');
  const list = document.getElementById('treasureChallengeList');
  const title = document.getElementById('treasureHuntTitle');
  const summary = document.getElementById('treasureHuntSummary');
  if (!panel || !list) return;
  try {
    const data = await loadTreasureHuntData();
    const day = (data.days || []).find(item => Number(item.dayId) === Number(dayId));
    if (!day || !day.challenges || !day.challenges.length) {
      panel.hidden = false;
      title.textContent = 'Caccia al tesoro';
      summary.textContent = 'Le sfide di questa giornata sono ancora in preparazione.';
      list.innerHTML = '<p class="empty-state">Le missioni di questa giornata verranno inserite qui quando saranno definite.</p>';
      return;
    }
    const progress = getTreasureProgress();
    const completed = day.challenges.filter(challenge => progress[challenge.id] === true).length;
    title.textContent = day.title || 'Caccia al tesoro';
    summary.textContent = completed + ' di ' + day.challenges.length + ' sfide completate. Puoi svolgerle nell’ordine che preferisci.';
    list.innerHTML = day.challenges.map(challenge => {
      const isComplete = progress[challenge.id] === true;
      const poiIndex = challenge.poiId ? currentPOIs.findIndex(poi => poi && poi.id === challenge.poiId) : -1;
      const placeButton = poiIndex >= 0
        ? '<button type="button" class="secondary-button treasure-place-button" onclick="openPOI(' + poiIndex + ')">Apri luogo collegato</button>'
        : '';
      const pointsText = Number.isFinite(challenge.points) ? challenge.points + ' punti' : 'Punteggio da definire';
      return '<article class="treasure-card' + (isComplete ? ' is-complete' : '') + '">' +
        '<div class="treasure-card-top"><h4>' + escapeHTML(challenge.title || 'Sfida') + '</h4>' +
        '<span class="treasure-points">' + escapeHTML(pointsText) + '</span></div>' +
        (challenge.area ? '<p class="treasure-area">' + escapeHTML(challenge.area) + '</p>' : '') +
        '<p class="treasure-task">' + escapeHTML(challenge.task || '') + '</p>' +
        '<div class="treasure-card-actions">' + placeButton +
        '<button type="button" class="' + (isComplete ? 'secondary-button' : '') + '" onclick="toggleTreasureChallenge(\'' + escapeHTML(challenge.id) + '\')">' +
        (isComplete ? '✓ Completata · Annulla' : 'Segna come completata') + '</button></div></article>';
    }).join('');
    panel.hidden = false;
  } catch (error) {
    console.error('Errore caricamento caccia al tesoro:', error);
    panel.hidden = false;
    title.textContent = 'Caccia al tesoro';
    summary.textContent = 'Non è stato possibile caricare le missioni.';
    list.innerHTML = '<p class="empty-state">Riprova quando la connessione è disponibile.</p>';
  }
}

function toggleTreasureHunt() {
  const panel = document.getElementById('treasureHuntPanel');
  if (!panel) return;
  if (panel.hidden) {
    panel.hidden = false;
    if (currentDay) renderTreasureHunt(currentDay.id);
  } else {
    panel.hidden = true;
  }
}

function toggleTreasureChallenge(challengeId) {
  if (!challengeId) return;
  const progress = getTreasureProgress();
  progress[challengeId] = progress[challengeId] !== true;
  if (!saveTreasureProgress(progress)) alert('Non è stato possibile salvare il progresso su questo dispositivo.');
  if (currentDay) renderTreasureHunt(currentDay.id);
}
