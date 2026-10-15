/* ---------- authentication (frontend-only demo: data is stored in this browser) ---------- */
const getUsers = () => JSON.parse(localStorage.getItem("dbt_users") || "[]");
async function hashPw(s) {
  const text = "dbt:" + s;
  if (window.crypto && crypto.subtle) {
    const b = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text),
    );
    return [...new Uint8Array(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  }
  let h = 5381;
  for (const ch of text) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0; // fallback for non-secure pages
  return "f" + h.toString(16);
}
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const initials = (n) =>
  n
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
function loadUser(u, keepView = false) {
  currentUser = u;
  const k = "dbt_" + u.email;
  transactions =
    JSON.parse(localStorage.getItem(k + "_tx") || "null") || seedTx();
  budgets =
    JSON.parse(localStorage.getItem(k + "_bd") || "null") ||
    structuredClone(demoBudgets);
  save();
  document.body.classList.add("authed");
  $("sbName").textContent = u.name;
  $("sbEmail").textContent = u.email;
  $("sbAvatar").textContent = $("topAvatar").textContent = initials(u.name);
  renderAll();
  // on refresh (keepView) go back to the page the user was on; on a fresh login start at the dashboard
  const last = localStorage.getItem("dbView");
  switchView(keepView && last && $(last + "View") ? last : "dashboard");
}
function logout() {
  if (!confirm("Log out of DailyBudget?")) return;
  localStorage.removeItem("dbt_session");
  currentUser = null;
  transactions = [];
  budgets = [];
  document.body.classList.remove("authed");
  ["loginForm", "signupForm"].forEach((f) => $(f).reset());
  document.querySelectorAll(".auth-error, .auth-notice").forEach((e) => (e.textContent = ""));
  showTab("login");
  showToast("You have been logged out");
}
function showTab(t) {
  document
    .querySelectorAll(".tab")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
  $("loginForm").hidden = t !== "login";
  $("signupForm").hidden = t !== "signup";
  $("forgotForm").hidden = t !== "forgot";
  // the Log in / Sign up tabs are not needed on the reset screen
  document.querySelector(".tabs").style.display = t === "forgot" ? "none" : "";
}
function initAuth() {
  document.querySelectorAll(".auth [data-tab]").forEach((el) =>
    el.addEventListener("click", (e) => {
      e.preventDefault();
      showTab(el.dataset.tab);
    }),
  );
  // eye icons: crossed eye = password hidden (click to show), open eye = password visible (click to hide)
  const svg = (paths) =>
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const EYE = svg(
    '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  );
  const EYE_OFF = svg(
    '<path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a18.5 18.5 0 0 1 5.06-5.94"/><path d="M9.9 4.24A10.9 10.9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
  );
  document.querySelectorAll(".eye").forEach((b) => {
    b.innerHTML = EYE_OFF;
    b.setAttribute("aria-label", "Show password");
    b.onclick = () => {
      const i = $(b.dataset.for),
        show = i.type === "password";
      i.type = show ? "text" : "password";
      b.innerHTML = show ? EYE : EYE_OFF;
      b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    };
  });
  $("suPass").addEventListener("input", () => {
    const p = $("suPass").value;
    let sc = 0;
    if (p.length >= 6) sc++;
    if (p.length >= 10) sc++;
    if (/[A-Z]/.test(p) && /[a-z]/.test(p)) sc++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) sc++;
    const n = p ? Math.max(1, sc) : 0;
    $("strBar").style.width = n * 25 + "%";
    $("strBar").style.background = [
      "",
      "#c95555",
      "#e0a030",
      "#6aa84f",
      "#0f7b5f",
    ][n];
    $("strText").textContent = p
      ? ["", "Weak", "Okay", "Good", "Strong"][n] + " password"
      : "Use letters, numbers, and symbols for a stronger password.";
  });
  $("signupForm").onsubmit = async (e) => {
    e.preventDefault();
    const name = $("suName").value.trim(),
      email = $("suEmail").value.trim().toLowerCase(),
      p = $("suPass").value,
      err = $("signupError");
    if (name.length < 2) return (err.textContent = "Enter your full name.");
    if (!emailOk(email))
      return (err.textContent = "Enter a valid email address.");
    if (p.length < 6)
      return (err.textContent = "Password must be at least 6 characters.");
    if (p !== $("suPass2").value)
      return (err.textContent = "Passwords do not match.");
    if (getUsers().some((u) => u.email === email))
      return (err.textContent =
        "That email is already registered. Try logging in.");
    const u = {
      name,
      email,
      hash: await hashPw(p),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("dbt_users", JSON.stringify([...getUsers(), u]));
    // Account is saved. Send the person to the log in page instead of the app.
    err.textContent = "";
    $("signupForm").reset();
    $("strBar").style.width = "0";
    showTab("login");
    $("liEmail").value = email;
    $("loginNotice").textContent =
      "Account created! Log in with your email and password to continue.";
    $("liPass").focus();
  };
  $("forgotForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("fpEmail").value.trim().toLowerCase(),
      p = $("fpPass").value,
      err = $("forgotError"),
      users = getUsers();
    if (!emailOk(email))
      return (err.textContent = "Enter a valid email address.");
    if (!users.some((u) => u.email === email))
      return (err.textContent = "No account found with that email.");
    if (p.length < 6)
      return (err.textContent = "Password must be at least 6 characters.");
    if (p !== $("fpPass2").value)
      return (err.textContent = "Passwords do not match.");
    const hash = await hashPw(p);
    localStorage.setItem(
      "dbt_users",
      JSON.stringify(users.map((u) => (u.email === email ? { ...u, hash } : u))),
    );
    err.textContent = "";
    $("forgotForm").reset();
    showTab("login");
    $("liEmail").value = email;
    $("loginNotice").textContent =
      "Password reset! Log in with your new password.";
    $("liPass").focus();
  };
  $("loginForm").onsubmit = async (e) => {
    e.preventDefault();
    const email = $("liEmail").value.trim().toLowerCase(),
      err = $("loginError");
    if (!emailOk(email) || !$("liPass").value)
      return (err.textContent = "Enter your email and password.");
    const u = getUsers().find((x) => x.email === email);
    if (!u || u.hash !== (await hashPw($("liPass").value)))
      return (err.textContent = "Email or password is incorrect.");
    localStorage.setItem("dbt_session", email);
    err.textContent = "";
    $("loginNotice").textContent = "";
    loadUser(u);
    showToast("Welcome back, " + u.name.split(" ")[0]);
  };
  $("logoutBtn").onclick = $("logoutTop").onclick = $("logoutProfile").onclick = logout;
  initProfile();
  const s = getUsers().find(
    (u) => u.email === localStorage.getItem("dbt_session"),
  );
  if (s) loadUser(s, true);
  // The app is ready (or there is no valid session), so stop hiding the login screen
  document.documentElement.classList.remove("has-session");
}

/* ---------- profile ---------- */
function saveUserChanges(changes) {
  const users = getUsers().map((u) =>
    u.email === currentUser.email ? { ...u, ...changes } : u,
  );
  localStorage.setItem("dbt_users", JSON.stringify(users));
  currentUser = { ...currentUser, ...changes };
}
function renderProfile() {
  const u = currentUser;
  if (!u) return;
  $("sbName").textContent = $("pfName").textContent = u.name;
  $("sbEmail").textContent = $("pfEmail").textContent = u.email;
  $("sbAvatar").textContent =
    $("topAvatar").textContent =
    $("pfAvatar").textContent =
      initials(u.name);
  $("pfSince").textContent = u.createdAt
    ? new Date(u.createdAt).toLocaleDateString("en-PH", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  $("pfTx").textContent = transactions.length;
  $("pfBudgets").textContent = budgets.length;
  $("pfBalance").textContent = money(incomeTotal() - expenseTotal());
  $("pfNameInput").value = u.name;
}
function initProfile() {
  $("nameForm").onsubmit = (e) => {
    e.preventDefault();
    const name = $("pfNameInput").value.trim(),
      msg = $("nameMsg");
    msg.classList.remove("ok");
    if (name.length < 2) return (msg.textContent = "Enter your full name.");
    saveUserChanges({ name });
    renderProfile();
    msg.textContent = "";
    showToast("Name updated");
  };
  $("pwForm").onsubmit = async (e) => {
    e.preventDefault();
    const msg = $("pwMsg"),
      np = $("pwNew").value;
    msg.classList.remove("ok");
    if ((await hashPw($("pwOld").value)) !== currentUser.hash)
      return (msg.textContent = "Current password is incorrect.");
    if (np.length < 6)
      return (msg.textContent = "New password must be at least 6 characters.");
    if (np !== $("pwNew2").value)
      return (msg.textContent = "New passwords do not match.");
    saveUserChanges({ hash: await hashPw(np) });
    $("pwForm").reset();
    msg.textContent = "";
    showToast("Password updated");
  };
}