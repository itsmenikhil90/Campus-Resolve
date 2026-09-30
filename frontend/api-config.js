(() => {
  const configuredBase =
    window.CAMPUS_RESOLVE_API_BASE ||
    window.AI_COMPLY_API_BASE ||
    "https://campus-resolve-kl3e.onrender.com/api";
  const normalizedBase = configuredBase.replace(/\/+$/, "");

  window.CAMPUS_RESOLVE_API_BASE = /\/api$/i.test(normalizedBase)
    ? normalizedBase
    : `${normalizedBase}/api`;
})();
