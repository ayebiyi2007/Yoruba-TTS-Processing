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
  capitalizeButton: document.getElementById("capitalize"),

  //StatusBox Elements
  statusBox: document.getElementById("statusBox"),
  statusText: document.getElementById("statusText"),

  characterButtons: document.querySelectorAll(".character-button")
}

const webSynthesis = {
   synth: window.speechSynthesis,
   supported: "speechSynthesis" in window && "SpeechSynthesisUtterance" in window,
   voices: null
};

const status = {
  isCapitalized: false
}

/**
 * @param {String} message - message to be displayed in the status box
 */
function setStatus(message) {
  webElements.statusText.textContent = message;
}

//Initial synthesis support check after DOM content loads
if (!webSynthesis.supported) {
  setStatus("This browser does not support speech synthesis.");
  webElements.speakButton.disabled = true;
  webElements.stopButton.disabled = true;
}else{
  setStatus("Ready.");
}

function loadVoices() {
  webSynthesis.voices = webSynthesis.synth.getVoices();

  webElements.voiceSelect.innerHTML = "";

  //Loading element
  if (webSynthesis.voices.length === 0) {
    const waitingOption = document.createElement("option");
    waitingOption.textContent = "Loading voices...";
    webElements.voiceSelect.appendChild(waitingOption);
    return;
  }

  //Voice list population
  for (let i = 0; i < webSynthesis.voices.length; i++) {
    const voice = webSynthesis.voices[i];
    const option = document.createElement("option");
    option.value = voice.voiceURI;

    let label = voice.name + " (" + voice.lang + ")";

    option.textContent = label;
    webElements.voiceSelect.appendChild(option);
  }
  
}

//execution of load
if (webSynthesis.supported) {
  loadVoices();
  // Some browsers load the voice list a little late, so we listen for
  // this event to know when it's ready.
  webSynthesis.synth.onvoiceschanged = loadVoices;
}

function updateCharacterCount() {
  const count = webElements.textBox.value.length;
  const word = count === 1 ? "character" : "characters";
  webElements.characterCount.textContent = count + " " + word;
}

updateCharacterCount();
webElements.textBox.addEventListener("input", updateCharacterCount);

/**
 * @param {Object} slider - the slider element
 * @param {Object} output - the output element
 */
function updateSliderLabel(slider, output) {
  output.value = Number(slider.value).toFixed(1);
}

updateSliderLabel(webElements.rateSlider, webElements.rateOutput);
updateSliderLabel(webElements.pitchSlider, webElements.pitchOutput);
updateSliderLabel(webElements.volumeSlider, webElements.volumeOutput);

webElements.rateSlider.addEventListener("input", () => {
  updateSliderLabel(webElements.rateSlider, webElements.rateOutput);
});
webElements.pitchSlider.addEventListener("input", () => {
  updateSliderLabel(webElements.pitchSlider, webElements.pitchOutput);
});
webElements.volumeSlider.addEventListener("input", () => {
  updateSliderLabel(webElements.volumeSlider, webElements.volumeOutput);
});

//Creation of event listeners for each Yoruba character
for (const characterButton of webElements.characterButtons) {
  characterButton.addEventListener("click", () => {
    const character = characterButton.dataset.character;
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

//Speak button
webElements.speakButton.addEventListener("click", () => {
  if (!webSynthesis.supported) {
    return;
  }

  const text = webElements.textBox.value.trim();

  if (text === "") {
    setStatus("Enter some Yoruba text first.");
    return;
  }

  webSynthesis.synth.cancel(); // stop anything that's already playing

  const utterance = new SpeechSynthesisUtterance(text);

  // Find the chosen voice from the dropdown
  for (let i = 0; i < webSynthesis.voices.length; i++) {
    if (webSynthesis.voices[i].voiceURI === webElements.voiceSelect.value) {
      utterance.voice = webSynthesis.voices[i];
      utterance.lang = webSynthesis.voices[i].lang;
      break;
    }
  }

  //Conversions for updated audio values
  utterance.rate = Number(webElements.rateSlider.value);
  utterance.pitch = Number(webElements.pitchSlider.value);
  utterance.volume = Number(webElements.volumeSlider.value);

  utterance.onstart = () => {
    setStatus("Speaking...");
  };

  utterance.onend = () => {
    setStatus("Finished speaking.");
  };

  utterance.onerror = function (event) {
    if (event.error !== "canceled" && event.error !== "interrupted") {
      setStatus("Speech error: " + event.error);
    }
  };

  webSynthesis.synth.speak(utterance);
});

//Stop button
webElements.stopButton.addEventListener("click", () => {
  if (!webSynthesis.supported) {
    return;
  }
  webSynthesis.synth.cancel();
  setStatus("Speech stopped.");
});

//Clear button
webElements.clearButton.addEventListener("click", () => {
  if (webSynthesis.supported) {
    webSynthesis.synth.cancel();
  }
  webElements.textBox.value = "";
  webElements.textBox.focus();
  updateCharacterCount();
  setStatus("Text cleared.");
});

//Capitalize Button
webElements.capitalizeButton.addEventListener("click", () => {
  for(const characterButton of webElements.characterButtons){
    const newChar = status.isCapitalized ?
        characterButton.dataset.character.toLowerCase():
        characterButton.dataset.character.toUpperCase();

    characterButton.dataset.character = newChar;
    characterButton.innerHTML = newChar;
  }

  status.isCapitalized = !status.isCapitalized;
  setStatus("Yoruba characters updated");
});

//Stop speech if the page is closed or refreshed
window.addEventListener("beforeunload", () => {
  if (webSynthesis.supported) {
    webSynthesis.synth.cancel();
  }
});

