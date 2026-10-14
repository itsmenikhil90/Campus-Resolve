(() => {
  const configuredBase =
    window.CAMPUS_RESOLVE_API_BASE ||
    window.AI_COMPLY_API_BASE;
  const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(window.location.hostname);
  const defaultBase = isLocalhost
    ? `${window.location.origin}/api`
    : "https://campus-resolve-kl3e.onrender.com/api";
  const normalizedBase = (configuredBase || defaultBase).replace(/\/+$/, "");

  window.CAMPUS_RESOLVE_API_BASE = /\/api$/i.test(normalizedBase)
    ? normalizedBase
    : `${normalizedBase}/api`;
})();
