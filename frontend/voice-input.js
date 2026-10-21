(() => {
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const initializeVoiceInputs = (root = document) => root.querySelectorAll("[data-voice-input]").forEach(controls => {
    if (controls.dataset.voiceInitialized) return;
    controls.dataset.voiceInitialized = "true";
    const target = document.querySelector(controls.dataset.target);
    const start = controls.querySelector("[data-voice-start]");
    const stop = controls.querySelector("[data-voice-stop]");
    const status = controls.querySelector("[data-voice-status]");
    const language = controls.querySelector("[data-voice-language]");
    if (!target || !start || !stop || !status || !language) return;

    const setState = (message, active = false, error = false) => {
      status.textContent = message;
      status.classList.toggle("is-listening", active);
      status.classList.toggle("is-error", error);
      start.hidden = active;
      stop.hidden = !active;
      language.disabled = active;
      start.setAttribute("aria-pressed", String(active));
    };

    if (!Recognition) {
      start.disabled = true;
      setState("Error: Speech recognition is not supported in this browser.", false, true);
      return;
    }

    let recognition = null;
    let receivedTranscript = false;
    start.addEventListener("click", () => {
      if (recognition) return;
      const session = new Recognition();
      recognition = session;
      receivedTranscript = false;
      session.lang = language.value;
      session.continuous = true;
      session.interimResults = false;
      setState("Listening…", true);

      session.onresult = event => {
        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .filter(result => result.isFinal)
          .map(result => result[0].transcript.trim())
          .filter(Boolean)
          .join(" ");
        if (!transcript) return;
        const separator = target.value && !/\s$/.test(target.value) ? " " : "";
        const nextValue = `${target.value}${separator}${transcript}`;
        if (target.maxLength > 0 && nextValue.length > target.maxLength) {
          setState(`Error: Speech would exceed the ${target.maxLength}-character limit.`, false, true);
          return;
        }
        target.value = nextValue;
        target.dispatchEvent(new Event("input", { bubbles: true }));
        receivedTranscript = true;
        setState("Processing speech…", true);
      };

      session.onerror = event => {
        const errors = {
          "not-allowed": "Microphone permission was denied.",
          "service-not-allowed": "Speech recognition is not permitted.",
          "audio-capture": "No microphone was found.",
          network: "Speech recognition is unavailable. Check your connection and try again.",
          "no-speech": "No speech was detected. Try again."
        };
        setState(`Error: ${errors[event.error] || "Speech recognition failed. Try again."}`, false, true);
      };

      session.onend = () => {
        if (recognition !== session) return;
        recognition = null;
        if (!status.classList.contains("is-error")) {
          setState("Ready");
          if (receivedTranscript) target.dispatchEvent(new Event("voiceinputcomplete"));
        }
      };

      try {
        session.start();
      } catch (error) {
        recognition = null;
        setState(`Error: ${error.message || "Could not start speech recognition."}`, false, true);
      }
    });

    stop.addEventListener("click", () => {
      if (!recognition) return;
      setState("Processing speech…", true);
      recognition.stop();
    });

    language.addEventListener("change", () => {
      if (recognition) {
        setState("Stop recording before changing the language.", true);
      }
    });
  });

  window.initializeVoiceInputs = initializeVoiceInputs;
  initializeVoiceInputs();
})();
