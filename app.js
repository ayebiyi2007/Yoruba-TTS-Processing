/**
 * Immediate Todo:
 * - Review and improve upon accessibility
 * - Simplify character input buttons with capitalization button
 * - Run edge cases
 *
 * Future Todo:
 * - Overhaul Web Synthesis API with custom made library
 * - Implement file to highlight, chunk, and process portions of Yoruba text
 *    Implications with highlighting: Will need to determine where or not I need to display HTML outside of box
 *    (XSS Concerns included) or rely on a contenteditable during the overhaul
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
  toneShiftButton: document.getElementById("tone-shift"),

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
  isCapitalized: false,
  toneStatesArr: ["low", "mid", "high"],
  toneState: "high"
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
  for (const voice of webSynthesis.voices) {
    const option = document.createElement("option");
    option.value = voice.voiceURI;
    option.textContent = voice.name + " (" + voice.lang + ")";

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
    const character = characterButton.dataset.current;
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
  for (const voice of webSynthesis.voices) {
    if (voice.voiceURI === webElements.voiceSelect.value) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
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
        characterButton.dataset.current.toLowerCase():
        characterButton.dataset.current.toUpperCase();

    characterButton.dataset.current = newChar;
    characterButton.innerHTML = newChar;
  }

  status.isCapitalized = !status.isCapitalized;
  setStatus("Yoruba characters updated");
});

webElements.toneShiftButton.addEventListener("click", () => {
  const index = status.toneStatesArr.indexOf(status.toneState);

  for(const characterButton of webElements.characterButtons){
    const newTone = status.toneStatesArr[(index + 1) % 3];

    switch(newTone){
      case "low":
        characterButton.dataset.current = characterButton.dataset.low;
        characterButton.innerHTML = characterButton.dataset.low;
        break;
      case "mid":
        characterButton.dataset.current = characterButton.dataset.mid;
        characterButton.innerHTML = characterButton.dataset.mid;
        break;
      case "high":
        characterButton.dataset.current = characterButton.dataset.high;
        characterButton.innerHTML = characterButton.dataset.high;
        break;
    }
  }

  status.toneState = status.toneStatesArr[(index + 1) % 3];
  setStatus("Yoruba characters updated");
});

//Stop speech if the page is closed or refreshed
window.addEventListener("beforeunload", () => {
  if (webSynthesis.supported) {
    webSynthesis.synth.cancel();
  }
});

