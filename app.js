/**
 * Immediate Todo:
 * - Review and improve upon accessibility
 * - Simplify character input buttons with capitalization button
 * - Run edge cases
 *
 * Future Todo:
 * - Overhaul Web Synthesis API with custom made library
 * - Implement file to highlight, chunk, and process portions of Yoruba text
 * - Find and implement Yoruba dictionary
 * - Determine method for handling gibberish, typos, and characters non-existent in the Yoruba language
 *
 */
const webElements = {

  textBox: document.getElementById("yorubaText"),
  voiceSelect: document.getElementById("voiceSelect"),

  //Slider elements
  rateSlider: document.getElementById("rate"),
  pitchSlider: document.getElementById("pitch"),
  volumeSlider: document.getElementById("volume"),

  rateOutput: document.getElementById("rateOutput"),
  pitchOutput: document.getElementById("pitchOutput"),
  volumeOutput: document.getElementById("volumeOutput"),

  characterCount: document.getElementById("characterCount"),

  speakButton: document.getElementById("speakButton"),
  stopButton: document.getElementById("stopButton"),
  clearButton: document.getElementById("clearButton"),

  //StatusBox Elements
  statusBox: document.getElementById("statusBox"),
  statusText: document.getElementById("statusText"),

  characterButtons: document.querySelectorAll(".character-button")
}

const webSynthesis = {
   synth: window.speechSynthesis,
   supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window
};

/**
 * Shows a message in the status box.
 */
function setStatus(message, state) {
  webElements.statusText.textContent = message;
  webElements.statusBox.dataset.state = state || "ready";
}

if (!webSynthesis.supported) {
  setStatus("This browser does not support speech synthesis.", "error");
  webElements.speakButton.disabled = true;
  webElements.stopButton.disabled = true;
}

// ---- Load the list of voices ----
function loadVoices() {
  const voices = webSynthesis.synth.getVoices();

  webElements.voiceSelect.innerHTML = "";

  if (voices.length === 0) {
    const waitingOption = document.createElement("option");
    waitingOption.textContent = "Loading voices...";
    webElements.voiceSelect.appendChild(waitingOption);
    return;
  }

  let firstYorubaVoiceId = null;

  for (let i = 0; i < voices.length; i++) {
    const voice = voices[i];
    const option = document.createElement("option");
    option.value = voice.voiceURI;

    let label = voice.name + " (" + voice.lang + ")";
    const isYoruba = voice.lang.toLowerCase().indexOf("yo") === 0;

    if (isYoruba) {
      label += " — Yoruba";
      if (!firstYorubaVoiceId) {
        firstYorubaVoiceId = voice.voiceURI;
      }
    }

    option.textContent = label;
    webElements.voiceSelect.appendChild(option);
  }

  if (firstYorubaVoiceId) {
    webElements.voiceSelect.value = firstYorubaVoiceId;
    setStatus("A Yoruba voice is available.", "ready");
  } else {
    setStatus("No Yoruba voice was found. You can still try another voice.", "warning");
  }
}

if (webSynthesis.supported) {
  loadVoices();
  // Some browsers load the voice list a little late, so we listen for
  // this event to know when it's ready.
  webSynthesis.synth.onvoiceschanged = loadVoices;
}

// ---- Character counter ----
function updateCharacterCount() {
  const count = webElements.textBox.value.length;
  const word = count === 1 ? "character" : "characters";
  webElements.characterCount.textContent = count + " " + word;
}

updateCharacterCount();
webElements.textBox.addEventListener("input", updateCharacterCount);

// ---- Sliders (rate, pitch, volume) ----
function updateSliderLabel(slider, output) {
  output.value = Number(slider.value).toFixed(1);
}

updateSliderLabel(webElements.rateSlider, webElements.rateOutput);
updateSliderLabel(webElements.pitchSlider, webElements.pitchOutput);
updateSliderLabel(webElements.volumeSlider, webElements.volumeOutput);

webElements.rateSlider.addEventListener("input", function () {
  updateSliderLabel(webElements.rateSlider, webElements.rateOutput);
});
webElements.pitchSlider.addEventListener("input", function () {
  updateSliderLabel(webElements.pitchSlider, webElements.pitchOutput);
});
webElements.volumeSlider.addEventListener("input", function () {
  updateSliderLabel(webElements.volumeSlider, webElements.volumeOutput);
});

// ---- Yoruba character insert buttons ----
for (let b = 0; b < webElements.characterButtons.length; b++) {
  webElements.characterButtons[b].addEventListener("click", function () {
    const character = this.dataset.character;
    const start = webElements.textBox.selectionStart;
    const end = webElements.textBox.selectionEnd;
    const text = webElements.textBox.value;

    webElements.textBox.value = text.slice(0, start) + character + text.slice(end);

    const newPosition = start + character.length;
    webElements.textBox.selectionStart = newPosition;
    webElements.textBox.selectionEnd = newPosition;
    webElements.textBox.focus();

    updateCharacterCount();
  });
}

// ---- Speak button ----
webElements.speakButton.addEventListener("click", function () {
  if (!webSynthesis.supported) {
    return;
  }

  const text = webElements.textBox.value.trim();

  if (text === "") {
    setStatus("Enter some Yoruba text first.", "warning");
    return;
  }

  webSynthesis.synth.cancel(); // stop anything that's already playing

  const utterance = new SpeechSynthesisUtterance(text);

  // Find the chosen voice from the dropdown
  const voices = webSynthesis.synth.getVoices();
  for (let i = 0; i < voices.length; i++) {
    if (voices[i].voiceURI === webElements.voiceSelect.value) {
      utterance.voice = voices[i];
      utterance.lang = voices[i].lang;
      break;
    }
  }

  utterance.rate = Number(webElements.rateSlider.value);
  utterance.pitch = Number(webElements.pitchSlider.value);
  utterance.volume = Number(webElements.volumeSlider.value);

  utterance.onstart = function () {
    setStatus("Speaking...", "speaking");
  };

  utterance.onend = function () {
    setStatus("Finished speaking.", "ready");
  };

  utterance.onerror = function (event) {
    if (event.error !== "canceled" && event.error !== "interrupted") {
      setStatus("Speech error: " + event.error, "error");
    }
  };

  webSynthesis.synth.speak(utterance);
});

// ---- Stop button ----
webElements.stopButton.addEventListener("click", function () {
  if (!webSynthesis.supported) {
    return;
  }
  webSynthesis.synth.cancel();
  setStatus("Speech stopped.", "ready");
});

// ---- Clear button ----
webElements.clearButton.addEventListener("click", function () {
  if (webSynthesis.supported) {
    webSynthesis.synth.cancel();
  }
  webElements.textBox.value = "";
  webElements.textBox.focus();
  updateCharacterCount();
  setStatus("Text cleared.", "ready");
});

// Stop speech if the page is closed or refreshed
window.addEventListener("beforeunload", function () {
  if (webSynthesis.supported) {
    webSynthesis.synth.cancel();
  }
});

