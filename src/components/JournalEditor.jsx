import { useRef, useState } from 'react'
import { hasChanges, insertPrompt, MAX_BODY_LENGTH, MAX_TITLE_LENGTH } from '../lib/journal.js'
import { MOODS, PROMPTS } from '../lib/journalContent.js'
import { useVisualViewport } from '../lib/useVisualViewport.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// Full-screen writing view. Every change is passed up and autosaved as a draft right away.
function JournalEditor({ draft, entries, restored, onChange, onDone, onDiscard, onDelete }) {
  const isEdit = Boolean(draft.entryId && entries.some((e) => e.id === draft.entryId))
  const [promptIndex, setPromptIndex] = useState(() => Math.floor(Math.random() * PROMPTS.length))
  const [showPrompt, setShowPrompt] = useState(!isEdit)
  const [touched, setTouched] = useState(false)
  const [confirm, setConfirm] = useState(null) // null | 'discard' | 'delete'
  const bodyRef = useRef(null)
  const viewport = useVisualViewport()

  function change(fields) {
    setTouched(true)
    onChange({ ...draft, ...fields })
  }

  function handleInsertPrompt() {
    change({ body: insertPrompt(draft.body, PROMPTS[promptIndex]) })
    setShowPrompt(false)
    requestAnimationFrame(() => {
      const el = bodyRef.current
      if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length) }
    })
  }

  function handleClose() {
    if (hasChanges(draft, entries)) setConfirm('discard')
    else onDiscard()
  }

  let status = ''
  if (touched) status = 'Draft saved on this phone'
  else if (restored) status = 'Draft restored'

  const style = viewport ? { height: viewport.height, top: viewport.offsetTop } : undefined

  return (
    <div className="editor" style={style} role="dialog" aria-modal="true" aria-label={isEdit ? 'Edit entry' : 'New entry'}>
      <header className="editor-bar">
        <button className="btn btn-ghost" onClick={handleClose}>{isEdit ? 'Close' : 'Discard'}</button>
        <span className="editor-heading">{isEdit ? 'Edit entry' : 'New entry'}</span>
        <button className="btn btn-primary editor-done" onClick={onDone}>Done</button>
      </header>

      <div className="editor-scroll">
        <p className="editor-status" data-testid="draft-status" aria-live="polite">{status}</p>

        <input
          className="editor-title"
          type="text"
          value={draft.title}
          maxLength={MAX_TITLE_LENGTH}
          placeholder="Title (optional)"
          aria-label="Title"
          onChange={(e) => change({ title: e.target.value })}
        />

        {showPrompt && (
          <div className="prompt-chip">
            <button className="prompt-text" onClick={handleInsertPrompt} aria-label={`Use prompt: ${PROMPTS[promptIndex]}`}>
              <span aria-hidden="true">💡</span> <span data-testid="prompt">{PROMPTS[promptIndex]}</span>
            </button>
            <button
              className="icon-btn"
              aria-label="Another prompt"
              onClick={() => setPromptIndex((i) => (i + 1) % PROMPTS.length)}
            >↻</button>
            <button className="icon-btn" aria-label="Hide prompt" onClick={() => setShowPrompt(false)}>✕</button>
          </div>
        )}

        <div className="mood-row" role="group" aria-label="Mood (optional)">
          {MOODS.map((m) => (
            <button
              key={m.id}
              className={draft.mood === m.id ? 'mood active' : 'mood'}
              aria-pressed={draft.mood === m.id}
              onClick={() => change({ mood: draft.mood === m.id ? null : m.id })}
            >
              <span className="mood-emoji" aria-hidden="true">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>

        <textarea
          ref={bodyRef}
          className="editor-body"
          value={draft.body}
          maxLength={MAX_BODY_LENGTH}
          placeholder="Write anything. Only you will see this."
          aria-label="Journal text"
          onChange={(e) => change({ body: e.target.value })}
        />

        {isEdit && (
          <button className="btn btn-ghost btn-ghost-danger editor-delete" onClick={() => setConfirm('delete')}>
            Delete entry
          </button>
        )}
      </div>

      {confirm === 'discard' && (
        <ConfirmDialog
          title={isEdit ? 'Discard changes?' : 'Discard this entry?'}
          message={isEdit ? 'Your saved entry stays as it was.' : 'What you wrote here will be removed.'}
          confirmLabel="Discard"
          cancelLabel="Keep writing"
          onCancel={() => setConfirm(null)}
          onConfirm={onDiscard}
        />
      )}
      {confirm === 'delete' && (
        <ConfirmDialog
          title="Delete this entry?"
          message="It will be removed from this phone. This can’t be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirm(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default JournalEditor
