(() => {
  const API = window.CAMPUS_RESOLVE_API_BASE;
  const launcher = document.querySelector("#chatLauncher");
  const panel = document.querySelector("#chatWindow");
  const close = document.querySelector("#chatClose");
  const messages = document.querySelector("#chatMessages");
  const form = document.querySelector("#chatForm");
  const input = document.querySelector("#chatInput");
  const send = document.querySelector("#chatSend");
  if (!launcher || !panel || !close || !messages || !form || !input || !send) return;

  const history = [];
  const addMessage = (text, role = "assistant", error = false) => {
    const bubble = document.createElement("p");
    bubble.className = `chat-message ${role}${error ? " error" : ""}`;
    bubble.textContent = text;
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
    return bubble;
  };

  addMessage("Hi! Ask me about filing, tracking, complaint statuses, or your own complaint updates.");

  launcher.addEventListener("click", () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  });
  close.addEventListener("click", () => {
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

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || send.disabled) return;

    const priorHistory = history.slice();
    addMessage(message, "user");
    input.value = "";
    input.disabled = true;
    send.disabled = true;
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
    } catch (error) {
      pending.textContent = error.message;
      pending.classList.add("error");
    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  });
})();
