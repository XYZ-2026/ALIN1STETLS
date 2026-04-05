/**
 * College Simplified — Shared Auth Module
 * ─────────────────────────────────────────
 * Handles: Session (localStorage), Login/Register UI guard,
 *          Topbar user display, Redirect to auth page
 * 
 * Include this script on EVERY page that needs auth:
 *   <script src="shared_auth.js"></script>
 * 
 * Then call: initAuth({ requireLogin: true/false })
 */

'use strict';

var AUTH_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbwsDORX0QxDfZRNVJ61YV2KxvlMYgaAvVYwD4Y8lIsGGme7eY_2rydyLi8-UwfhKSmC/exec',
  SESSION_KEY: 'cs_unified_session',
  THEME_KEY: 'cs_theme',
  AUTH_PAGE: 'auth.html',
  HOME_PAGE: 'index.html'
};

/* ══════════════════════════════════════════
   SESSION MANAGEMENT
   ══════════════════════════════════════════ */

function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_CONFIG.SESSION_KEY)); }
  catch (e) { return null; }
}

function setSession(user) {
  localStorage.setItem(AUTH_CONFIG.SESSION_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(AUTH_CONFIG.SESSION_KEY);
}

function isLoggedIn() {
  return !!getSession();
}

/* ══════════════════════════════════════════
   API HELPER
   ══════════════════════════════════════════ */

async function authApi(action, payload) {
  var url = AUTH_CONFIG.API_URL + '?action=' + encodeURIComponent(action);
  var opts = { redirect: 'follow' };

  var POST_ACTIONS = { register: 1, login: 1, updateUser: 1 };
  if (POST_ACTIONS[action]) {
    opts.method = 'POST';
    opts.headers = { 'Content-Type': 'text/plain' };
    opts.body = JSON.stringify(payload || {});
  } else {
    opts.method = 'GET';
    if (payload) url += '&payload=' + encodeURIComponent(JSON.stringify(payload));
  }

  try {
    var r = await fetch(url, opts);
    var text = await r.text();
    if (!text) return { ok: false, error: 'Empty response from server.' };
    if (text.trim().startsWith('<')) return { ok: false, error: 'Server returned HTML. Re-deploy Apps Script.' };
    return JSON.parse(text);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

/* ══════════════════════════════════════════
   THEME
   ══════════════════════════════════════════ */

function initTheme() {
  var t = localStorage.getItem(AUTH_CONFIG.THEME_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', t);
  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = (t === 'dark');
    toggle.addEventListener('change', function () {
      var theme = this.checked ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem(AUTH_CONFIG.THEME_KEY, theme);
    });
  }
}

/* ══════════════════════════════════════════
   TOPBAR USER DISPLAY
   ══════════════════════════════════════════ */

function renderAuthUI() {
  var user = getSession();
  var authArea = document.getElementById('authArea');
  if (!authArea) return;

  if (user) {
    var ini = (user.name || 'U').charAt(0).toUpperCase();
    authArea.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<div style="width:30px;height:30px;border-radius:50%;background:var(--brand-soft);color:var(--brand);display:grid;place-items:center;font-weight:700;font-size:12px">' + ini + '</div>' +
      '<span style="font-size:13px;font-weight:600;color:var(--ink2);max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escAuth(user.name) + '</span>' +
      '<button onclick="doLogout()" style="padding:6px 12px;border-radius:8px;font-size:12px;font-weight:600;color:var(--muted);background:none;border:1.5px solid var(--stroke);cursor:pointer;font-family:inherit;transition:all .15s">Logout</button>' +
      '</div>';
  } else {
    authArea.innerHTML =
      '<a href="' + AUTH_CONFIG.AUTH_PAGE + '" style="padding:7px 14px;border-radius:9px;font-size:13px;font-weight:600;color:#fff;background:var(--brand);text-decoration:none;display:inline-flex;align-items:center;gap:5px;box-shadow:0 4px 14px var(--brand-ring);transition:background .15s">🔐 Login</a>';
  }
}

/* ══════════════════════════════════════════
   AUTH GUARD
   ══════════════════════════════════════════ */

/**
 * Initialize auth on the current page.
 * @param {Object} opts
 * @param {boolean} opts.requireLogin - If true, redirects to auth page if not logged in
 * @param {string}  opts.toolContainerId - ID of the tool container to show/hide based on auth
 */
function initAuth(opts) {
  opts = opts || {};
  initTheme();
  renderAuthUI();

  var session = getSession();

  if (opts.requireLogin && !session) {
    // Show auth-required message instead of redirect
    var container = opts.toolContainerId ? document.getElementById(opts.toolContainerId) : null;
    if (container) {
      container.innerHTML =
        '<div style="text-align:center;padding:60px 20px">' +
        '<div style="font-size:48px;margin-bottom:16px">🔐</div>' +
        '<h2 style="font-family:Poppins,sans-serif;font-weight:700;font-size:20px;color:var(--ink);margin-bottom:8px">Login Required</h2>' +
        '<p style="color:var(--muted);font-size:14px;max-width:400px;margin:0 auto 20px;line-height:1.6">You need to be logged in to use this tool. Create a free account or sign in to continue.</p>' +
        '<a href="' + AUTH_CONFIG.AUTH_PAGE + '?redirect=' + encodeURIComponent(window.location.href) + '" style="display:inline-flex;align-items:center;gap:6px;padding:12px 24px;border-radius:10px;font-size:14px;font-weight:600;color:#fff;background:var(--brand);text-decoration:none;box-shadow:0 4px 14px var(--brand-ring);transition:background .15s">🔐 Login / Register</a>' +
        '</div>';
    }
    return null;
  }
  return session || { guest: true };
}

/* ══════════════════════════════════════════
   LOGOUT
   ══════════════════════════════════════════ */

function doLogout() {
  clearSession();
  window.location.href = AUTH_CONFIG.HOME_PAGE;
}

/* ══════════════════════════════════════════
   UTILITY
   ══════════════════════════════════════════ */

function escAuth(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
