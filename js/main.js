// Between the Lines — site behaviour.
// Edit the two settings below, then redeploy.

// 1. Your Calendly event link, e.g. "https://calendly.com/your-name/scouting-report-demo".
//    Leave it empty to show the "Email us" fallback instead of the booking widget.
const CALENDLY_URL = "https://calendly.com/zcochran/scouting-report-tool-demo";

// 2. Where the Transfer Portal interest form is sent. Paste a form endpoint
//    (Formspree, Getform, Basin, etc.). Leave empty to fall back to email.
const INTEREST_FORM_ENDPOINT = "";
const CONTACT_EMAIL = "zcochran@ucsd.edu";

// ---------------------------------------------------------------------------

// Tabs (Overview / Report / Players / Scout Chat)
(function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  const intro = document.getElementById("tab-intro");

  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (intro) intro.textContent = tab.dataset.intro || "";
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });

  // Links like "#app-overview" (from the rotating questions) open that tab.
  document.querySelectorAll("[data-open-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = document.getElementById(link.dataset.openTab);
      if (tab) select(tab, false);
    });
  });

  const initial = tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
  select(initial, false);
})();

// Calendly booking widget
(function setupCalendly() {
  const box = document.getElementById("calendly");
  if (!box) return;
  if (!CALENDLY_URL) return; // keeps the fallback content already in the page
  box.innerHTML = "";
  box.className = "calendly-inline-widget";
  box.setAttribute("data-url", CALENDLY_URL + (CALENDLY_URL.includes("?") ? "&" : "?") + "hide_gdpr_banner=1&primary_color=1e7a3c");
  const script = document.createElement("script");
  script.src = "https://assets.calendly.com/assets/external/widget.js";
  script.async = true;
  document.body.appendChild(script);
})();

// Transfer Portal interest form
(function setupInterestForm() {
  const form = document.getElementById("interest-form");
  if (!form) return;
  const status = document.getElementById("form-status");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    if (!INTEREST_FORM_ENDPOINT) {
      const lines = [];
      data.forEach((v, k) => { if (v) lines.push(k + ": " + v); });
      const body = encodeURIComponent(lines.join("\n"));
      window.location.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Transfer Portal interest") + "&body=" + body;
      return;
    }
    status.textContent = "Sending…";
    try {
      const res = await fetch(INTEREST_FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = "Thanks. We'll be in touch as the Transfer Portal tool takes shape.";
    } catch (err) {
      status.textContent = "That didn't send. Please email " + CONTACT_EMAIL + " instead.";
    }
  });
})();
