const itineraryDays = [
  {
    id: 1,
    date: "02 GEN",
    title: "Giorno 1 – Mitte",
    description: "Mitte storica, cortili segreti e mercati",
    file: "data/day-1.json"
  },
  {
    id: 2,
    date: "03 GEN",
    title: "Giorno 2",
    description: "Seconda giornata di esplorazione",
    file: "data/day-2.json"
  },
  {
    id: 3,
    date: "04 GEN",
    title: "Giorno 3",
    description: "Terza giornata di esplorazione",
    file: "data/day-3.json"
  },
  {
    id: 4,
    date: "05 GEN",
    title: "Giorno 4",
    description: "Quarta giornata di esplorazione",
    file: "data/day-4.json"
  }
];

let currentDay = null;
let currentPOI = null;
let currentPOIs = [];

document.addEventListener("DOMContentLoaded", () => {
  renderHome();
});

function renderHome() {
  const container = document.getElementById("days");

  container.innerHTML = itineraryDays.map(day => `
    <a href="#" class="day-card"
       onclick="openDay(${day.id}); return false;">
      <span class="day-date">${day.date}</span>
      <h3>${day.title}</h3>
      <p>${day.description}</p>
      <p style="margin-top:12px;color:#b58a52">
        Esplora itinerario →
      </p>
    </a>
  `).join("");
}

async function openDay(id) {
  const day = itineraryDays.find(d => d.id === id);
  if (!day) return;

  currentDay = day;

  try {
    const response = await fetch(day.file);

    if (!response.ok) {
      throw new Error("File itinerario non trovato");
    }

    const data = await response.json();

    currentPOIs = data.pois || [];

    document.getElementById("home").hidden = true;
    document.getElementById("poiPage").hidden = true;
    document.getElementById("dayPage").hidden = false;

    document.getElementById("dayTitle").textContent =
      data.title || day.title;

    document.getElementById("dayDescription").textContent =
      data.description || day.description;

    renderPOIs();

    if (typeof initializeMap === "function") {
      initializeMap(currentPOIs);
    }

    window.scrollTo(0, 0);

  } catch (error) {
    alert("Non riesco a caricare questo itinerario. Controlla che il file JSON sia stato creato.");
    console.error(error);
  }
}

function renderPOIs() {
  const container = document.getElementById("poiList");

  container.innerHTML = currentPOIs.map((poi, index) => `
    <article class="day-card">
      <span class="day-date">TAPPA ${index + 1}</span>
      <h3>${escapeHTML(poi.name)}</h3>
      <p>${escapeHTML(poi.shortDescription || "")}</p>
      <button onclick="openPOI(${index})">
        Scopri questa tappa →
      </button>
    </article>
  `).join("");
}

function openPOI(index) {
  currentPOI = currentPOIs[index];
  if (!currentPOI) return;

  document.getElementById("dayPage").hidden = true;
  document.getElementById("poiPage").hidden = false;

  document.getElementById("poiTitle").textContent =
    currentPOI.name;

  document.getElementById("poiDescription").textContent =
    currentPOI.description || currentPOI.shortDescription || "";

  window.scrollTo(0, 0);
}

function showHome() {
  stopGPS();
  document.getElementById("dayPage").hidden = true;
  document.getElementById("poiPage").hidden = true;
  document.getElementById("home").hidden = false;
  window.scrollTo(0, 0);
}

function backToDay() {
  stopStory();
  document.getElementById("poiPage").hidden = true;
  document.getElementById("dayPage").hidden = false;
  window.scrollTo(0, 0);
}

function speakStory() {
  if (!currentPOI || !("speechSynthesis" in window)) return;

  stopStory();

  const text = currentPOI.audioText || currentPOI.description;
  if (!text) return;

  const speech = new SpeechSynthesisUtterance(text);
  speech.lang = "it-IT";
  speech.rate = 0.9;

  window.speechSynthesis.speak(speech);
}

function stopStory() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function navigateGoogle() {
  if (!currentPOI) return;

  const { lat, lng } = currentPOI;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`,
    "_blank"
  );
}

function navigateLocus() {
  if (!currentPOI) return;

  const { lat, lng } = currentPOI;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

  window.location.href =
    `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(currentPOI.name)})`;
}
