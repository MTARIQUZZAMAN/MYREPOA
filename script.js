// ---------------------------------------------------------------------------
// Demo login — plain vanilla JS, no dependencies.
// Dummy data: add more users here later (username, phone) — one line each.
// ---------------------------------------------------------------------------
const USERS = [
  { username: "tarik", phone: "123456" },
];

const SESSION_KEY = "demoSessionUser";

// Close the mobile sidebar drawer if it is open (no-op otherwise).
function closeSidebar() {
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  const toggleBtn = document.getElementById("menu-toggle-btn");
  if (!sidebar || !backdrop || !toggleBtn) return;
  sidebar.classList.remove("open");
  backdrop.hidden = true;
  toggleBtn.setAttribute("aria-expanded", "false");
  toggleBtn.setAttribute("aria-label", "Open menu");
}

// ---------------------------------------------------------------------------
// Login page logic (runs only when the login form is present)
// ---------------------------------------------------------------------------
function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const usernameInput = document.getElementById("username");
  const phoneInput = document.getElementById("phone");
  const usernameError = document.getElementById("username-error");
  const phoneError = document.getElementById("phone-error");
  const formError = document.getElementById("form-error");

  function clearErrors() {
    usernameError.hidden = true;
    phoneError.hidden = true;
    formError.hidden = true;
    usernameInput.classList.remove("input-error");
    phoneInput.classList.remove("input-error");
    usernameInput.removeAttribute("aria-invalid");
    phoneInput.removeAttribute("aria-invalid");
  }

  function markInvalid(input) {
    input.classList.add("input-error");
    input.setAttribute("aria-invalid", "true");
  }

  function showFieldError(input, errorEl, message) {
    markInvalid(input);
    errorEl.textContent = message;
    errorEl.hidden = false;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    // Normalize: username trim + case-insensitive; phone trim only.
    const username = usernameInput.value.trim().toLowerCase();
    const phone = phoneInput.value.trim();

    // Required checks take precedence over the credential check.
    let hasEmpty = false;
    if (username === "") {
      showFieldError(usernameInput, usernameError, "Username is required");
      hasEmpty = true;
    }
    if (phone === "") {
      showFieldError(phoneInput, phoneError, "Phone number is required");
      hasEmpty = true;
    }
    if (hasEmpty) return;

    // Credential check: both fields must match the SAME dummy account.
    const matched = USERS.some(
      (user) => user.username.toLowerCase() === username && user.phone === phone
    );

    if (!matched) {
      // Generic combined message — never reveals which field failed.
      formError.textContent = "Invalid username or phone number";
      formError.hidden = false;
      markInvalid(usernameInput);
      markInvalid(phoneInput);
      return;
    }

    // Success: set the session flag, then navigate to the welcome page.
    sessionStorage.setItem(SESSION_KEY, username);
    window.location.href = "welcome.html";
  });
}

// ---------------------------------------------------------------------------
// Welcome page: left sidebar menu (active link + content-section switching)
// ---------------------------------------------------------------------------
function initSidebarMenu() {
  const links = document.querySelectorAll(".menu-link");
  if (links.length === 0) return;

  const sidebar = document.getElementById("sidebar");
  if (sidebar && sidebar.dataset.menuInitialized) return; // guard: bfcache restore
  if (sidebar) sidebar.dataset.menuInitialized = "true";

  const sections = document.querySelectorAll(".content-section");

  function showSection(id) {
    sections.forEach(function (section) {
      const isTarget = section.id === id;
      section.hidden = !isTarget;
      if (isTarget) section.focus();
    });
  }

  links.forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();

      links.forEach(function (other) {
        other.removeAttribute("aria-current");
      });
      link.setAttribute("aria-current", "page");

      // "#section-home" -> "section-home"
      showSection(link.getAttribute("href").slice(1));
      closeSidebar();
    });
  });
}

// ---------------------------------------------------------------------------
// Welcome page: mobile sidebar drawer (hamburger toggle + backdrop)
// ---------------------------------------------------------------------------
function initMobileSidebar() {
  const toggleBtn = document.getElementById("menu-toggle-btn");
  const sidebar = document.getElementById("sidebar");
  const backdrop = document.getElementById("backdrop");
  if (!toggleBtn || !sidebar || !backdrop) return;
  if (sidebar.dataset.mobileInitialized) return; // guard: bfcache restore
  sidebar.dataset.mobileInitialized = "true";

  function openSidebar() {
    sidebar.classList.add("open");
    backdrop.hidden = false;
    toggleBtn.setAttribute("aria-expanded", "true");
    toggleBtn.setAttribute("aria-label", "Close menu");
  }

  toggleBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  backdrop.addEventListener("click", closeSidebar);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sidebar.classList.contains("open")) {
      closeSidebar();
      toggleBtn.focus();
    }
  });
}

// ---------------------------------------------------------------------------
// Welcome page: live clock in the Home section
// ---------------------------------------------------------------------------
function initClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;
  if (clockEl.dataset.clockInitialized) return; // guard: bfcache restore
  clockEl.dataset.clockInitialized = "true";

  function renderTime() {
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const date = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    clockEl.textContent = time + " — " + date;
  }

  renderTime();
  clockEl.hidden = false;

  // Re-sync at :00 seconds — one setInterval(…, 1000) left unattended
  // can drift over long sessions; this pattern doesn't.
  (function scheduleNextTick() {
    setTimeout(function () {
      renderTime();
      scheduleNextTick();
    }, 1000 - (Date.now() % 1000));
  })();
}

// ---------------------------------------------------------------------------
// Welcome page: antique analog clock (roman numerals, wooden case, ticking hands)
// ---------------------------------------------------------------------------
const SVG_NS = "http://www.w3.org/2000/svg";

function initAnalogClock() {
  const svg = document.getElementById("antique-clock");
  if (!svg) return;
  if (svg.dataset.clockInitialized) return; // guard: bfcache restore
  svg.dataset.clockInitialized = "true";

  const CX = 100;
  const CY = 112;
  const ROMAN = ["XII", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI"];

  const ticksGroup = document.getElementById("clock-ticks");
  const numeralsGroup = document.getElementById("clock-numerals");
  const hourHand = document.getElementById("hour-hand");
  const minuteHand = document.getElementById("minute-hand");
  const secondHand = document.getElementById("second-hand");
  const digital = document.getElementById("clock-digital");

  // Minor tick marks (60) + major ones at the hours.
  if (ticksGroup) {
    for (let i = 0; i < 60; i++) {
      const angle = (i * 6 * Math.PI) / 180;
      const major = i % 5 === 0;
      const rOuter = 69;
      const rInner = major ? 63 : 66.5;
      const tick = document.createElementNS(SVG_NS, "line");
      tick.setAttribute("x1", (CX + rInner * Math.sin(angle)).toFixed(2));
      tick.setAttribute("y1", (CY - rInner * Math.cos(angle)).toFixed(2));
      tick.setAttribute("x2", (CX + rOuter * Math.sin(angle)).toFixed(2));
      tick.setAttribute("y2", (CY - rOuter * Math.cos(angle)).toFixed(2));
      tick.setAttribute("stroke", major ? "#4a3319" : "#8a744d");
      tick.setAttribute("stroke-width", major ? "2" : "1");
      ticksGroup.appendChild(tick);
    }
  }

  // Roman numerals I–XII.
  if (numeralsGroup) {
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30 * Math.PI) / 180;
      const numeral = document.createElementNS(SVG_NS, "text");
      numeral.setAttribute("x", (CX + 55 * Math.sin(angle)).toFixed(2));
      numeral.setAttribute("y", (CY - 55 * Math.cos(angle)).toFixed(2));
      numeral.setAttribute("text-anchor", "middle");
      numeral.setAttribute("dominant-baseline", "central");
      numeral.setAttribute("class", "clock-numeral");
      numeral.textContent = ROMAN[i];
      numeralsGroup.appendChild(numeral);
    }
  }

  function setRotation(el, degrees) {
    if (el) el.setAttribute("transform", "rotate(" + degrees + " " + CX + " " + CY + ")");
  }

  function tick() {
    const now = new Date();
    const h = now.getHours() % 12;
    const m = now.getMinutes();
    const s = now.getSeconds();

    setRotation(hourHand, 30 * h + 0.5 * m);
    setRotation(minuteHand, 6 * m + 0.1 * s);
    setRotation(secondHand, 6 * s); // discrete antique-style tick

    if (digital) {
      digital.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    }
  }

  tick();
  if (digital) digital.hidden = false;

  // Re-sync at :00 seconds — no drift over long sessions.
  (function scheduleNextTick() {
    setTimeout(function () {
      tick();
      scheduleNextTick();
    }, 1000 - (Date.now() % 1000));
  })();
}

// ---------------------------------------------------------------------------
// Welcome page logic (runs only when the logout button is present)
// ---------------------------------------------------------------------------
function initWelcomePage() {
  const logoutBtn = document.getElementById("logout-btn");
  if (!logoutBtn) return;

  const sessionUser = sessionStorage.getItem(SESSION_KEY);

  // Access guard: no session flag -> back to the login page.
  if (!sessionUser) {
    window.location.replace("index.html");
    return;
  }

  const heading = document.getElementById("welcome-heading");
  if (heading) {
    heading.textContent = "Welcome, " + sessionUser + "!";
  }

  const profileUsername = document.getElementById("profile-username");
  if (profileUsername) {
    profileUsername.textContent = sessionUser;
  }

  initSidebarMenu();
  initMobileSidebar();
  initClock();
  initAnalogClock();

  // Guard: on a bfcache restore this runs again — don't stack listeners.
  if (logoutBtn.dataset.logoutInitialized) return;
  logoutBtn.dataset.logoutInitialized = "true";

  logoutBtn.addEventListener("click", function () {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace("index.html");
  });
}

// bfcache hardening: when the page is restored from back/forward cache
// (e.g. Back button after logout), re-run the welcome guard.
window.addEventListener("pageshow", function (event) {
  if (event.persisted) {
    initWelcomePage();
    closeSidebar();
  }
});

initLoginPage();
initWelcomePage();
