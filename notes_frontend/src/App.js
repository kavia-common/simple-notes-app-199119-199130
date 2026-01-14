import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import {
  createNote,
  deleteNote,
  getApiBaseUrl,
  listNotes,
  updateNote,
} from "./api/notesApi";
import { NoteListItem } from "./components/NoteListItem";
import { ConfirmModal } from "./components/ConfirmModal";

function normalizeNotesList(data) {
  // Backend might return {items:[...]} or just [...]
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.items)) return data.items;
  return [];
}

function sortNotesByUpdatedDesc(notes) {
  return [...notes].sort((a, b) => {
    const aTime = new Date(a?.updated_at || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.updated_at || b?.updatedAt || 0).getTime();
    return bTime - aTime;
  });
}

function getNoteId(note) {
  return note?.id ?? note?.note_id ?? note?._id;
}

// PUBLIC_INTERFACE
function App() {
  /** Notes app: list on the left, editor on the right, CRUD via backend API. */
  const apiBase = useMemo(() => getApiBaseUrl(), []);

  const [notes, setNotes] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isNewDraft, setIsNewDraft] = useState(false);

  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedNote = useMemo(() => {
    const n = notes.find((x) => String(getNoteId(x)) === String(selectedId));
    return n || null;
  }, [notes, selectedId]);

  async function refreshNotes(keepSelection = true) {
    setError("");
    setLoadingList(true);
    try {
      const data = await listNotes();
      const list = sortNotesByUpdatedDesc(normalizeNotesList(data));
      setNotes(list);

      if (!keepSelection) {
        setSelectedId(null);
        return;
      }

      // If current selection no longer exists, clear it.
      if (selectedId != null) {
        const stillExists = list.some(
          (n) => String(getNoteId(n)) === String(selectedId)
        );
        if (!stillExists) setSelectedId(null);
      }
    } catch (e) {
      setError(e?.message || "Failed to load notes.");
    } finally {
      setLoadingList(false);
    }
  }

  useEffect(() => {
    // Initial load
    refreshNotes(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep editor in sync with selection, unless we're in a new draft state.
  useEffect(() => {
    if (isNewDraft) return;
    if (!selectedNote) {
      setEditorTitle("");
      setEditorContent("");
      return;
    }
    setEditorTitle(selectedNote.title || "");
    setEditorContent(selectedNote.content || "");
  }, [selectedNote, isNewDraft]);

  function handleAddNote() {
    setError("");
    setIsNewDraft(true);
    setSelectedId(null);
    setEditorTitle("");
    setEditorContent("");
  }

  async function handleSave() {
    setError("");

    const title = editorTitle.trim();
    const content = editorContent;

    if (!title && !content.trim()) {
      setError("Please add a title or some content before saving.");
      return;
    }

    setSaving(true);
    try {
      if (isNewDraft || selectedId == null) {
        const created = await createNote({ title: title || "Untitled", content });
        const createdId = getNoteId(created);
        await refreshNotes(true);
        setIsNewDraft(false);
        if (createdId != null) setSelectedId(createdId);
      } else {
        await updateNote(selectedId, { title: title || "Untitled", content });
        await refreshNotes(true);
      }
    } catch (e) {
      setError(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  function requestDelete() {
    setError("");
    if (!selectedId) return;
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    if (!selectedId) return;
    setDeleting(true);
    setError("");
    try {
      await deleteNote(selectedId);
      setShowDeleteConfirm(false);
      setIsNewDraft(false);
      setSelectedId(null);
      setEditorTitle("");
      setEditorContent("");
      await refreshNotes(false);
    } catch (e) {
      setError(e?.message || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="appShell">
      <header className="header">
        <div className="headerInner">
          <div className="brand">
            <h1 className="brandTitle">Simple Notes</h1>
            <div className="brandMeta" title={`API: ${apiBase}`}>
              API: {apiBase}
            </div>
          </div>

          <button type="button" className="btn btnPrimary" onClick={handleAddNote}>
            Add Note
          </button>
        </div>
      </header>

      <main className="main">
        <div className="split">
          <section className="panel" aria-label="Notes list">
            <div className="panelHeader">
              <h2 className="panelTitle">Notes</h2>
              <button
                type="button"
                className="btn btnGhost"
                onClick={() => refreshNotes(true)}
                disabled={loadingList}
                aria-label="Refresh notes"
              >
                Refresh
              </button>
            </div>

            <div className="panelBody">
              {loadingList ? (
                <div className="statusRow">Loading notes…</div>
              ) : notes.length === 0 ? (
                <div className="emptyState">
                  No notes yet. Click <strong>Add Note</strong> to create your first
                  note.
                </div>
              ) : (
                <div className="noteList" role="list">
                  {notes.map((n) => {
                    const id = getNoteId(n);
                    const selected = selectedId != null && String(id) === String(selectedId);
                    return (
                      <div key={String(id)} role="listitem">
                        <NoteListItem
                          note={n}
                          selected={selected}
                          onSelect={() => {
                            setError("");
                            setIsNewDraft(false);
                            setSelectedId(id);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="panel" aria-label="Editor">
            <div className="panelHeader">
              <h2 className="panelTitle">
                {isNewDraft || selectedId == null ? "New Note" : "Edit Note"}
              </h2>

              <button
                type="button"
                className="btn btnDanger"
                onClick={requestDelete}
                disabled={!selectedId || isNewDraft || deleting}
              >
                Delete
              </button>
            </div>

            <div className="panelBody">
              <div className="editor">
                {error ? (
                  <div className="statusRow statusError" role="alert">
                    {error}
                  </div>
                ) : null}

                <label className="fieldLabel">
                  Title
                  <input
                    className="input"
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    placeholder="Untitled"
                  />
                </label>

                <label className="fieldLabel">
                  Content
                  <textarea
                    className="textarea"
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    placeholder="Write your note…"
                  />
                </label>

                <div className="editorActions">
                  <div className="smallHint">
                    {saving ? "Saving…" : "Changes are saved when you click Save."}
                  </div>

                  <button
                    type="button"
                    className="btn btnSuccess"
                    onClick={handleSave}
                    disabled={saving || deleting}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ConfirmModal
        open={showDeleteConfirm}
        title="Delete note?"
        message="This action cannot be undone."
        confirmText={deleting ? "Deleting…" : "Delete"}
        cancelText="Cancel"
        variant="danger"
        onCancel={() => {
          if (deleting) return;
          setShowDeleteConfirm(false);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default App;
