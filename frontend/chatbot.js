(() => {
  const API = window.CAMPUS_RESOLVE_API_BASE;
  const launcher = document.querySelector("#chatLauncher");
  const panel = document.querySelector("#chatWindow");
  const close = document.querySelector("#chatClose");
  const messages = document.querySelector("#chatMessages");
  const form = document.querySelector("#chatForm");
  const input = document.querySelector("#chatInput");
  const send = document.querySelector("#chatSend");
  const voiceMode = document.querySelector("#chatVoiceMode");
  const audioStatus = document.querySelector("#chatAudioStatus");
  if (!launcher || !panel || !close || !messages || !form || !input || !send) return;

  const history = [];
  let activeSpeechButton = null;
  const stopSpeech = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    if (activeSpeechButton) activeSpeechButton.textContent = "🔊 Listen";
    activeSpeechButton = null;
  };

  const playSpeech = (text, button) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      if (audioStatus) audioStatus.textContent = "Audio playback is not supported in this browser.";
      return;
    }
    if (activeSpeechButton === button) {
      stopSpeech();
      return;
    }
    stopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = document.querySelector("#chatVoiceLanguage")?.value || "en-US";
    activeSpeechButton = button;
    button.textContent = "Stop";
    if (audioStatus) audioStatus.textContent = "Speaking response…";
    utterance.onend = () => {
      if (activeSpeechButton !== button) return;
      button.textContent = "🔊 Listen";
      activeSpeechButton = null;
      if (audioStatus) audioStatus.textContent = "";
    };
    utterance.onerror = () => {
      if (activeSpeechButton !== button) return;
      button.textContent = "🔊 Listen";
      activeSpeechButton = null;
      if (audioStatus) audioStatus.textContent = "Could not play this response.";
    };
    window.speechSynthesis.speak(utterance);
  };

  const addMessage = (text, role = "assistant", error = false) => {
    const bubble = document.createElement("p");
    bubble.className = `chat-message ${role}${error ? " error" : ""}`;
    const content = document.createElement("span");
    content.textContent = text;
    bubble.append(content);
    if (role === "assistant" && !error) {
      const listen = document.createElement("button");
      listen.type = "button";
      listen.className = "chat-speak";
      listen.textContent = "🔊 Listen";
      listen.setAttribute("aria-label", "Listen to this response");
      listen.disabled = !window.speechSynthesis || !window.SpeechSynthesisUtterance;
      listen.title = listen.disabled ? "Audio playback is not supported in this browser" : "Listen to response";
      listen.addEventListener("click", () => playSpeech(content.textContent, listen));
      bubble.append(listen);
    }
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return content;
  };

  addMessage("Hi! Ask me about filing, tracking, complaint statuses, or your own complaint updates.");

  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  });
  close.addEventListener("click", () => {
    stopSpeech();
    panel.querySelector("[data-voice-stop]")?.click();
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  });
  document.querySelectorAll("[data-chat-prompt]").forEach(button => {
    button.addEventListener("click", () => {
      input.value = button.dataset.chatPrompt;
      form.requestSubmit();
    });
  });

  input.addEventListener("voiceinputcomplete", () => {
    if (voiceMode?.checked && !send.disabled) form.requestSubmit();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || send.disabled) return;

    const priorHistory = history.slice();
    addMessage(message, "user");
    input.value = "";
    panel.querySelector("[data-voice-stop]")?.click();
    input.disabled = true;
    send.disabled = true;
    panel.querySelectorAll("[data-voice-start], [data-voice-stop], [data-voice-language]").forEach(control => {
      control.disabled = true;
    });
    const pending = addMessage("Thinking…");
    const token = localStorage.getItem("campus_resolve_auth_token")
      || localStorage.getItem("aicomply_auth_token")
      || localStorage.getItem("aimt_auth_token");

    try {
      const response = await fetch(`${API}/chatbot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message, history: priorHistory })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Could not contact the chat assistant.");
      pending.textContent = data.answer;
      history.push({ role: "user", content: message }, { role: "assistant", content: data.answer });
      if (history.length > 8) history.splice(0, history.length - 8);
      const listen = pending.parentElement.querySelector(".chat-speak");
      if (voiceMode?.checked && listen) playSpeech(data.answer, listen);
    } catch (error) {
      pending.textContent = error.message;
      pending.parentElement.classList.add("error");
    } finally {
      input.disabled = false;
      send.disabled = false;
      panel.querySelectorAll("[data-voice-start], [data-voice-stop], [data-voice-language]").forEach(control => {
        control.disabled = false;
      });
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });
})();
