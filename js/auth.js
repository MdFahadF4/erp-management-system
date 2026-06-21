/** Local dev: js/config.js (gitignored). Vercel: window.__ERP_CONFIG__ injected in index.html at build. */
const runtime = globalThis.__ERP_CONFIG__;
let API_URL;
let CLIENT_TOKEN;

if (runtime?.API_URL && runtime?.CLIENT_TOKEN) {
  API_URL = runtime.API_URL;
  CLIENT_TOKEN = runtime.CLIENT_TOKEN;
} else {
  const config = await import('./config.js');
  API_URL = config.API_URL;
  CLIENT_TOKEN = config.CLIENT_TOKEN;
}

export { API_URL, CLIENT_TOKEN };

/** Normalize secure-backend JSON into the shape the rest of the app expects */
function normalizeApiResponse(result) {
  if (!result || typeof result !== "object") return { success: false, message: "Empty server response." };

  if (result.success === undefined && result.status !== undefined) {
    result.success = result.status === "success";
  }

  if (result.records === undefined) {
    if (Array.isArray(result.data)) result.records = result.data;
    else if (Array.isArray(result.data?.records)) result.records = result.data.records;
    else if (Array.isArray(result.payload)) result.records = result.payload;
    else if (Array.isArray(result.payload?.records)) result.records = result.payload.records;
    else if (Array.isArray(result.rows)) result.records = result.rows;
  }

  if (result.userData === undefined && result.user) result.userData = result.user;

  return result;
}

/** Secure POST helper — attaches client token to every backend request */
export async function apiRequest(dataObject) {
  const response = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ ...dataObject, token: CLIENT_TOKEN })
  });

  if (!response.ok) {
    throw new Error(`Server error (${response.status})`);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Invalid JSON from server");
  }

  return normalizeApiResponse(result);
}

export async function processLogin(username, password) {
  try {
    const result = await apiRequest({
      action: "LOGIN",
      payload: { username, password }
    });
    if (result.success && result.userData) {
      localStorage.setItem('currentUser', JSON.stringify(result.userData));
      localStorage.setItem('isLoggedIn', 'true');
      return { success: true, user: result.userData };
    }
    const msg = result.message || 'Login failed. Check username, password, and security token.';
    alert(msg);
    return { success: false, message: msg };
  } catch (error) {
    console.error("Authentication system pipeline failure:", error);
    alert("Connection Error. Check API URL, Apps Script deploy, and that CLIENT_TOKEN matches Code.gs SECRET_TOKEN.");
    return { success: false, message: error.message };
  }
}

export function processLogout() {
  localStorage.clear();
  window.location.reload();
}

export function fetchSessionUser() {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
}
