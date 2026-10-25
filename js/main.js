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

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Light / dark theme. Light by default (set in <head>); the toggle switches it
// and the choice is remembered on this device.
(function setupTheme() {
  const root = document.documentElement;
  const button = document.querySelector(".theme-toggle");
  const meta = document.querySelector('meta[name="theme-color"]');

  function apply(theme, animate) {
    if (animate && !reduceMotion) {
      root.classList.add("theme-switching");
      setTimeout(() => root.classList.remove("theme-switching"), 350);
    }
    root.setAttribute("data-theme", theme);
    if (button) button.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    if (meta) meta.setAttribute("content", theme === "dark" ? "#15201A" : "#FFFFFF");
  }

  apply(root.getAttribute("data-theme") === "dark" ? "dark" : "light", false);

  if (button) {
    button.addEventListener("click", () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("theme", next); } catch (e) {}
      apply(next, true);
    });
  }
})();

// Tabs (Overview / Report / Players / Scout Chat)
(function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  if (!tabs.length) return;
  const intro = document.getElementById("tab-intro");

  // The open tab is kept in the link (?tab=players), so a page can be shared directly.
  const nameOf = (t) => t.id.replace("tab-", "");
  function remember(tab) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", nameOf(tab));
    history.replaceState(null, "", url);
  }

  function select(tab, focus, animate) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.remove("panel-in");
      if (on && animate) { void panel.offsetWidth; panel.classList.add("panel-in"); }
    });
    if (intro) intro.textContent = tab.dataset.intro || "";
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { select(tab, false, true); remember(tab); });
    tab.addEventListener("keydown", (e) => {
      let next = null;
      if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") next = tabs[0];
      if (e.key === "End") next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); select(next, true, true); remember(next); }
    });
  });

  // Links with data-open-tab (from the rotating questions) open that tab.
  document.querySelectorAll("[data-open-tab]").forEach((link) => {
    link.addEventListener("click", () => {
      const tab = document.getElementById(link.dataset.openTab);
      if (tab) { select(tab, false, true); remember(tab); }
    });
  });

  const asked = new URLSearchParams(window.location.search).get("tab");
  const fromLink = asked && tabs.find((t) => nameOf(t) === asked);
  const initial = fromLink || tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
  select(initial, false, false);
  if (fromLink && !window.location.hash) document.getElementById("app").scrollIntoView();
})();

// Tab bar: the dark selector slides between tabs. Press anywhere on the bar and drag,
// and it lifts into a glass lens that follows the pointer; let go to open the tab under it.
(function setupTabGlide() {
  const list = document.querySelector(".pill-list");
  if (!list) return;
  const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
  const thumb = document.createElement("span");
  thumb.className = "pill-thumb";
  thumb.setAttribute("aria-hidden", "true");
  list.prepend(thumb);
  list.classList.add("has-thumb");

  const current = () => tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
  const centre = (t) => t.offsetLeft + t.offsetWidth / 2;
  const nearest = (x) => tabs.reduce((best, t) => (Math.abs(centre(t) - x) < Math.abs(centre(best) - x) ? t : best));
  function place(tab) {
    thumb.style.width = tab.offsetWidth + "px";
    thumb.style.transform = "translateX(" + tab.offsetLeft + "px)";
  }

  let startX = null, lastX = 0, dragging = false, under = null, justDragged = false, settle = 0;

  // Follow the selection however it changes (click, keyboard, links), and any resize.
  new MutationObserver(() => { if (!dragging) place(current()); })
    .observe(list, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
  new ResizeObserver(() => { if (!dragging) place(current()); }).observe(list);
  place(current());
  requestAnimationFrame(() => requestAnimationFrame(() => thumb.classList.add("is-ready")));

  list.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    startX = lastX = e.clientX;
  });

  list.addEventListener("pointermove", (e) => {
    if (startX === null) return;
    if (!dragging) {
      if (Math.abs(e.clientX - startX) < 5) return;
      dragging = true;
      list.setPointerCapture(e.pointerId);
      list.classList.add("is-dragging");
      thumb.classList.add("is-dragging");
    }
    const x = e.clientX - list.getBoundingClientRect().left;
    const tab = nearest(x);
    const width = tab.offsetWidth;
    const left = Math.max(4, Math.min(list.clientWidth - 4 - width, x - width / 2));
    thumb.style.width = width + "px";
    thumb.style.transform = "translateX(" + left + "px)";
    if (tab !== under) {
      if (under) under.classList.remove("is-under");
      tab.classList.add("is-under");
      under = tab;
    }
    // Stretch a little in the direction of travel, like a drop of liquid, then settle.
    const speed = Math.abs(e.clientX - lastX);
    lastX = e.clientX;
    thumb.style.setProperty("--sx", String(1.12 + Math.min(speed * 0.012, 0.22)));
    thumb.style.setProperty("--sy", String(1.12 - Math.min(speed * 0.006, 0.1)));
    clearTimeout(settle);
    settle = setTimeout(() => { thumb.style.removeProperty("--sx"); thumb.style.removeProperty("--sy"); }, 120);
  });

  function release() {
    startX = null;
    if (!dragging) return;
    dragging = false;
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 0);
    list.classList.remove("is-dragging");
    thumb.classList.remove("is-dragging");
    thumb.style.removeProperty("--sx");
    thumb.style.removeProperty("--sy");
    const pick = under;
    if (under) under.classList.remove("is-under");
    under = null;
    if (pick && pick !== current()) pick.click();
    else place(current());
  }
  list.addEventListener("pointerup", release);
  list.addEventListener("pointercancel", release);
  // A drag ends with a click on whatever was under the pointer; ignore it.
  list.addEventListener("click", (e) => { if (justDragged && e.isTrusted) e.stopPropagation(); }, true);
})();

// Overview: the toss-up spot flips between the two players sharing it.
(function setupTossFlip() {
  const slot = document.querySelector(".slot.toss");
  if (!slot) return;
  let timer = 0;
  const flip = () => slot.classList.toggle("is-flipped");
  function auto() {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => { if (slot.offsetParent) flip(); }, 3200);
  }
  slot.addEventListener("click", () => { flip(); auto(); });
  auto();
})();

// Rotating questions: keyboard focus shows the focused question's slide,
// so focus never lands on a slide that is out of view.
(function setupBannerFocus() {
  const track = document.querySelector(".qtrack");
  if (!track) return;
  const slides = Array.from(track.querySelectorAll(".qslide"));
  slides.forEach((slide, i) => {
    slide.addEventListener("focusin", () => {
      track.style.animation = "none";
      track.style.transform = "translateY(-" + (i * 100 / slides.length) + "%)";
    });
  });
  track.addEventListener("focusout", (e) => {
    if (track.contains(e.relatedTarget)) return;
    track.style.animation = "";
    track.style.transform = "";
  });
})();

// Scout Chat demo: plays one question at a time, then moves on to the next.
// With reduced motion, all the questions stay listed.
(function setupChat() {
  const chat = document.querySelector(".chat");
  if (!chat || reduceMotion) return;
  const turns = Array.from(chat.querySelectorAll(".exchange"));
  if (!turns.length) return;
  turns.forEach((t) => {
    const q = t.querySelector(".typing");
    if (q) q.style.setProperty("--n", String(q.textContent.length));
  });
  let i = 0;
  function show(n) {
    turns[i].classList.remove("is-on");
    i = n;
    turns[i].classList.add("is-on");
  }
  turns[0].classList.add("is-on");
  chat.classList.add("is-live");
  // Each question's animation lasts one cycle; at the end of it, show the next question.
  chat.addEventListener("animationiteration", (e) => {
    if (e.target.classList.contains("bubble-q")) show((i + 1) % turns.length);
  });
  // Opening the tab always starts on the first question, the one the banner asks.
  const panel = chat.closest('[role="tabpanel"]');
  if (panel) {
    new MutationObserver(() => { if (!panel.hidden) show(0); })
      .observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  }
})();

// Headline: words rise in one after another when the page opens.
(function setupSplitHeadline() {
  if (reduceMotion) return;
  document.querySelectorAll(".hero h1, .page-hero h1").forEach((h) => {
    const words = h.textContent.trim().split(/\s+/);
    h.setAttribute("aria-label", h.textContent.trim());
    h.innerHTML = words.map((w, i) => '<span class="split-word" aria-hidden="true" style="--w:' + i + '">' + w + "</span>").join(" ");
  });
})();

// Entrances: blocks below the first screen rise in once as they scroll into view.
(function setupReveal() {
  if (reduceMotion || !("IntersectionObserver" in window)) return;
  const targets = Array.from(document.querySelectorAll(
    ".cred .wrap, .app-head, .pills, .panel-card, .sub-head, .section-card, .demo-card, .band h2, .card, .steps li, .person, .why-bubbles p, .form, .cta-row > div"
  )).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  const counts = new Map();
  targets.forEach((el) => {
    const i = counts.get(el.parentElement) || 0;
    counts.set(el.parentElement, i + 1);
    el.style.setProperty("--i", String(Math.min(i, 5)));
    el.classList.add("reveal");
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-in");
      io.unobserve(el);
      // Once it has risen in, hand the element back to its own hover styles.
      setTimeout(() => el.classList.remove("reveal", "is-in"), 1100);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  targets.forEach((el) => io.observe(el));
})();

// Pitch markings: each line draws out from the centre the first time it scrolls into view.
(function setupPitchMarks() {
  const marks = Array.from(document.querySelectorAll(".pitch-mark"));
  if (!marks.length || reduceMotion || !("IntersectionObserver" in window)) return;
  document.documentElement.classList.add("marks");
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-drawn");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px" });
  marks.forEach((m) => io.observe(m));
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
    const button = form.querySelector('button[type="submit"]');
    status.textContent = "Sending…";
    if (button) button.disabled = true;
    try {
      const res = await fetch(INTEREST_FORM_ENDPOINT, { method: "POST", body: data, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      status.textContent = "Thanks. We'll be in touch as the Transfer Portal tool takes shape.";
    } catch (err) {
      status.textContent = "That didn't send. Please email " + CONTACT_EMAIL + " instead.";
    } finally {
      if (button) button.disabled = false;
    }
  });
})();
