console.log("script loaded");

let synth;
let isPlaying = false;
let loop;
let currentPattern = [];
let currentMatraCount = 0;
let player;
let currentLoop = null;
let actualTempo = 120;
let matraIndex = 0;
let matraEventId = null;

// Select DOM elements ONCE, globally
const playPauseBtn = document.getElementById("playPauseBtn");
const tempoSlider = document.getElementById("tempo");
const tempoValue = document.getElementById("tempoValue");

// Add the event listener directly
tempoSlider.addEventListener("input", () => {
  tempoValue.textContent = tempoSlider.value;
  updateTempo(tempoSlider.value);
});

// Update tempo
function updateTempo(bpm) {
  actualTempo = parseInt(bpm);
  tempoValue.textContent = bpm;
  if (player && player.state === 'started') {
    const stretch = actualTempo / player._originalBPM;
    player.playbackRate = stretch;
  }
}

// Highlight current matra
function highlightMatra(index) {
  for (let i = 0; i < currentMatraCount; i++) {
    document.getElementById(`matra-${i}`)?.classList.remove("active");
  }
  document.getElementById(`matra-${index}`)?.classList.add("active");
}

// Play or pause
function togglePlayPause() {
  const btn = document.getElementById('playPauseBtn');
  if (isPlaying) {
    pauseLoop();
    btn.textContent = '▶️ Play';
  } else {
    Tone.start();
    playLoop();
    btn.textContent = '⏸️ Pause';
  }
  isPlaying = !isPlaying;
}

function setupPattern() {
const selectedTala = document.getElementById("tala").value;
const selectedInstrument = document.getElementById("instrument").value;

const pattern = patterns[selectedTala];
if (!pattern) return;


currentPattern = pattern.notes;
currentMatraCount = pattern.matras;
}

//renderMatras(currentMatraCount);
//synth = getSynthByInstrument(selectedInstrument);

let index = 0;


/* Tone.Transport.start();
playPauseBtn.textContent = "⏸️ Pause";
isPlaying = true; */

// Stop and reset
function stopPlayback() {
  const playPauseBtn = document.getElementById("playPauseButton");
  Tone.Transport.stop();
  Tone.Transport.cancel();
  if (loop) {
    Tone.Transport.clear(loop);
    loop = null;
  }

  const matraContainer = document.getElementById("matras");
  matraContainer.innerHTML = "";

  /* playPauseBtn.textContent = "▶️ Play";
  isPlaying = false; */
}

function getLoopPath(raga, tala, key, bpm) {
  const baseTempo = Math.round(bpm / 10) * 10; // nearest 10
  return {
    url: `data/loops/${raga}/${tala}/${key}/${baseTempo}.mp3`,
    baseTempo
  };
}

function startMatraScheduler() {
  const tala = document.getElementById("tala").value;
  const matraCount = getMatraCountForTala(tala);
  currentMatraCount = matraCount;

  renderMatras(matraCount);
  matraIndex = 0;

  if (matraEventId) {
    Tone.Transport.clear(matraEventId);
  }

  matraEventId = Tone.Transport.scheduleRepeat((time) => {
    highlightMatra(matraIndex % matraCount);
    matraIndex++;
  }, "4n"); // One matra per quarter note
}

function getMatraCountForTala(tala) {
  const matraMap = {
    teentaal: 16,
    jhaptaal: 10,
    ektaal: 12,
    rupak: 7
  };
  return matraMap[tala] || 16;
}

async function playLoop() {
  const raga = document.getElementById("raga").value;
  const tala = document.getElementById("tala").value;
  const key = document.getElementById("key").value;
  const bpm = actualTempo;

  const { url, baseTempo } = getLoopPath(raga, tala, key, bpm);

  // Example value until Tala info is dynamic
  renderMatras(16);
  startMatraHighlight(16);

  // Stop old player
  if (player) {
    player.stop();
    player.dispose();
  }

  player = new Tone.Player({
    url,
    loop: true,
    autostart: true,
    onload: () => {
      player._originalBPM = baseTempo;
      player.playbackRate = bpm / baseTempo;
      player.toDestination();
      //Tone.Transport.start();

      // Start Transport if not already started
      if (!Tone.Transport.state === "started") {
        Tone.Transport.start();
      }

      startMatraScheduler(); // Schedule visual matras
    }
  }).toDestination();

  currentLoop = { raga, tala, key, bpm };
}

function pauseLoop() {
  if (player) {player.stop();
  player.dispose();
  player = null;
  }
  stopMatraHighlight();
}

function stopLoop() {
  if (player) {
    player.stop();
    player.dispose();
    player = null;
  }
  stopMatraHighlight();

  const btn = document.getElementById('playPauseBtn');
  btn.textContent = "▶️ Play";
  isPlaying = false;

  // Also reset matra visuals if needed
  const matraContainer = document.getElementById("matras");
  matraContainer.innerHTML = "";
}

function renderMatras(count) {
  const matraContainer = document.getElementById("matras");
  matraContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const div = document.createElement("div");
    div.classList.add("matra");
    div.id = `matra-${i}`;
    div.innerText = i + 1;
    matraContainer.appendChild(div);
  }
}

let matraInterval;
function startMatraHighlight(totalMatras) {
  let index = 0;
  const interval = (60 / actualTempo) * 1000 * 4; // one cycle every 4 beats (Teentaal)
  if (matraInterval) clearInterval(matraInterval);
  matraInterval = setInterval(() => {
    highlightMatra(index % totalMatras);
    index++;
  }, interval);
}

function stopMatraHighlight() {
  if (matraEventId) {
    Tone.Transport.clear(matraEventId);
    matraEventId = null;
  }
  const matras = document.querySelectorAll(".matra");
  matras.forEach(m => m.classList.remove("active"));
  matraIndex = 0;
}