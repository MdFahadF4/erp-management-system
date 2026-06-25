const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const CLIENT_TOKEN = import.meta.env.VITE_CLIENT_TOKEN || '';

export { API_URL, CLIENT_TOKEN };

function normalizeApiResponse(result) {
  if (!result || typeof result !== 'object') {
    return { success: false, message: 'Empty server response.' };
  }
  if (result.success === undefined && result.status !== undefined) {
    result.success = result.status === 'success';
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

export async function apiRequest(dataObject) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...dataObject, token: CLIENT_TOKEN })
  });

  if (!response.ok) {
    throw new Error(`Server error (${response.status})`);
  }

  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error('Invalid JSON from server');
  }

  return normalizeApiResponse(result);
}

export async function processLogin(username, password) {
  try {
    const result = await apiRequest({
      action: 'LOGIN',
      payload: { username, password }
    });
    if (result.success && result.userData) {
      localStorage.setItem('currentUser', JSON.stringify(result.userData));
      localStorage.setItem('isLoggedIn', 'true');
      return { success: true, user: result.userData };
    }
    const msg = result.message || 'Login failed. Check username and password.';
    return { success: false, message: msg };
  } catch (error) {
    console.error('Authentication failure:', error);
    return {
      success: false,
      message: 'Connection Error. Check API URL and that the server is running.'
    };
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

export function isLoggedIn() {
  return localStorage.getItem('isLoggedIn') === 'true' && !!fetchSessionUser();
}
