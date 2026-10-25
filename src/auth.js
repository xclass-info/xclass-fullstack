// src/auth.js
// Login state for our own backend (replaces Firebase Auth). The logged-in
// account is `{ uid, email, isAdmin, student, teacher }` from /api/auth/me:
// `student` / `teacher` are that account's records (or null), the same
// "is there a students/{uid} or teachers/{uid} doc" checks as before.
import { api } from "./api";

const TOKEN_KEY = "hr_auth_token";

let token = readToken();
let user = null;
let loaded = false;
let loading = null;
const listeners = new Set();

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(value) {
  token = value;
  try {
    if (value) localStorage.setItem(TOKEN_KEY, value);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private mode etc. - stays logged in for this page load only.
  }
}

export function getToken() {
  // Re-read on every call so all tabs share the latest login (logging in or
  // out in one tab must not leave another tab using a stale token).
  const stored = readToken();
  if (stored !== null || token === null) token = stored;
  return token;
}

// Another tab logged in or out: refresh who's logged in here too.
try {
  window.addEventListener("storage", (e) => {
    if (e.key === TOKEN_KEY) {
      token = e.newValue;
      loadUser();
    }
  });
} catch {
  // No window (tests/SSR) - nothing to sync.
}

function setUser(next) {
  user = next;
  loaded = true;
  listeners.forEach((cb) => cb(user));
}

async function loadUser() {
  if (!token) return setUser(null);
  try {
    setUser(await api.get("/auth/me"));
  } catch (err) {
    if (err.status === 401) writeToken(null);
    setUser(null);
  }
}

export function getCurrentUser() {
  return user;
}

// Calls `cb(user | null)` now (once known) and on every login/logout.
// Returns an unsubscribe function, like Firebase's onAuthStateChanged.
export function onAuthStateChanged(cb) {
  listeners.add(cb);
  if (loaded) cb(user);
  else if (!loading) loading = loadUser().finally(() => (loading = null));
  return () => listeners.delete(cb);
}

// Re-fetch the account (e.g. after it changed on the server).
export function refreshUser() {
  return loadUser().then(() => user);
}

export async function login(email, password) {
  return signInWith(await api.post("/auth/login", { email: email.trim(), password }));
}

// Sign in from a { token, user } response (password login, or a mentor
// applicant's "continue your application" email link).
export function signInWith(res) {
  writeToken(res.token);
  setUser(res.user);
  return res.user;
}

export function logout() {
  writeToken(null);
  setUser(null);
}

export function register(fields) {
  return api.post("/auth/register", fields);
}

export function sendPasswordReset(email) {
  return api.post("/auth/forgot-password", { email: email.trim() });
}
