// ---------------------------------------------------------------------------
// Demo login — plain vanilla JS, no dependencies.
// Dummy data: add more users here later (username, phone) — one line each.
// ---------------------------------------------------------------------------
const USERS = [
  { username: "tarik", phone: "123456" },
];

const SESSION_KEY = "demoSessionUser";

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
  }
});

initLoginPage();
initWelcomePage();
