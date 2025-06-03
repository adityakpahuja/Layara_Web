// script.js
console.log("Layara app loaded");

// Select DOM elements
const playBtn = document.getElementById("playBtn");
const tempoSlider = document.getElementById("tempo");
const tempoValue = document.getElementById("tempoValue");

// Update tempo display
tempoSlider.addEventListener("input", () => {
  tempoValue.textContent = tempoSlider.value;
});

// Placeholder Tone.js test sound
let synth = new Tone.Synth().toDestination();

let isPlaying = false;
let loop;

// Play/pause logic
playBtn.addEventListener("click", async () => {
  await Tone.start(); // Required on user gesture
  if (!isPlaying) {
    Tone.Transport.bpm.value = +tempoSlider.value;

    loop = new Tone.Loop((time) => {
      synth.triggerAttackRelease("C4", "8n", time);
    }, "4n").start(0);

    Tone.Transport.start();
    playBtn.textContent = "Pause";
    isPlaying = true;
  } else {
    Tone.Transport.stop();
    loop.stop();
    playBtn.textContent = "Play";
    isPlaying = false;
  }
});
