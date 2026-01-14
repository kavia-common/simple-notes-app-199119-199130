const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * The backend base URL.
 * Uses REACT_APP_API_BASE if provided; otherwise falls back to localhost.
 */
const API_BASE_URL =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.REACT_APP_API_BASE) ||
  DEFAULT_BASE_URL;

/**
 * Normalize base URL by removing trailing slash (so we can safely append paths).
 */
function normalizeBaseUrl(url) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const baseUrl = normalizeBaseUrl(API_BASE_URL);

/**
 * Generic JSON request helper with consistent error handling.
 */
async function requestJson(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  // Some endpoints may return empty bodies; try to parse JSON safely.
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message =
      (data && (data.detail || data.message)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** List all notes. Expected backend: GET /notes -> Note[] */
  return requestJson("/notes", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function getNote(id) {
  /** Fetch a note by id. Expected backend: GET /notes/{id} -> Note */
  return requestJson(`/notes/${encodeURIComponent(id)}`, { method: "GET" });
}

// PUBLIC_INTERFACE
export async function createNote({ title, content }) {
  /** Create a note. Expected backend: POST /notes {title, content} -> Note */
  return requestJson("/notes", {
    method: "POST",
    body: JSON.stringify({ title, content }),
  });
}

// PUBLIC_INTERFACE
export async function updateNote(id, { title, content }) {
  /** Update a note. Expected backend: PUT/PATCH /notes/{id} {title, content} -> Note */
  // Use PUT by default (common CRUD pattern).
  return requestJson(`/notes/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ title, content }),
  });
}

// PUBLIC_INTERFACE
export async function deleteNote(id) {
  /** Delete a note. Expected backend: DELETE /notes/{id} -> {success:true} or empty */
  return requestJson(`/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns the effective API base URL the frontend is using. */
  return baseUrl;
}
