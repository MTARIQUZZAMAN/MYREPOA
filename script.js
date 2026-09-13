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
