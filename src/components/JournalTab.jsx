import { useState } from 'react'
import {
  buildFeed, clearDraft, commitDraft, deleteEntry, draftFromEntry, filterFeed, loadDraft, loadJournal,
  newDraft, saveDraft, saveJournal,
} from '../lib/journal.js'
import { MOODS } from '../lib/journalContent.js'
import { formatTimeOfDay, groupByDay } from '../lib/logStats.js'
import { useToday } from '../lib/useToday.js'
import { loadWalks } from '../lib/walkStorage.js'
import JournalEditor from './JournalEditor.jsx'
import ResultPill from './ResultPill.jsx'

const moodInfo = (id) => MOODS.find((m) => m.id === id)

// Journal tab: your entries plus walk notes (read from the walk log), newest first.
function JournalTab({ onOpenWalk }) {
  const today = useToday()
  const [initial] = useState(() => {
    const journal = loadJournal()
    const walks = loadWalks()
    const draft = loadDraft()
    return { ...journal, walks: walks.walks, walksRecovered: walks.recovered, draft }
  })
  const [entries, setEntries] = useState(initial.entries)
  const [draft, setDraft] = useState(initial.draft) // non-null = the editor is open
  const [restored, setRestored] = useState(initial.draft != null)
  const [query, setQuery] = useState('')
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some journal entries were damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )

  function persist(next) {
    if (!saveJournal(next)) setNotice('Couldn’t save on this phone. Is private browsing on?')
    setEntries(next)
  }

  function openEditor(d) {
    setRestored(false)
    setDraft(d) // only autosaved once something is typed
  }

  function closeEditor() {
    clearDraft()
    setDraft(null)
  }

  // Autosave: every change is written to the phone immediately.
  function handleChange(next) {
    saveDraft(next)
    setDraft(next)
  }

  function handleDone() {
    const next = commitDraft(entries, draft, Date.now())
    if (next !== entries) persist(next)
    closeEditor()
  }

  if (draft) {
    return (
      <JournalEditor
        draft={draft}
        entries={entries}
        restored={restored}
        onChange={handleChange}
        onDone={handleDone}
        onDiscard={closeEditor}
        onDelete={() => { persist(deleteEntry(entries, draft.entryId)); closeEditor() }}
      />
    )
  }

  const feed = buildFeed(entries, initial.walks)
  const shown = filterFeed(feed, query)
  const groups = groupByDay(shown, today, (item) => item.time)

  const noticeBox = notice && (
    <div className="notice" role="status">
      <span>{notice}</span>
      <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
    </div>
  )

  if (feed.length === 0) {
    return (
      <div className="journal">
        {noticeBox}
        <section className="empty">
          <div className="empty-icon" aria-hidden="true">📓</div>
          <h2>Your journal</h2>
          <p>A few honest lines can help. Write about today, an urge, or something good. It stays on this phone.</p>
          <button className="btn btn-primary btn-big" onClick={() => openEditor(newDraft(Date.now()))}>
            Write your first entry
          </button>
        </section>
      </div>
    )
  }

  return (
    <div className="journal">
      {noticeBox}
      <button className="btn btn-primary btn-big" onClick={() => openEditor(newDraft(Date.now()))}>
        + New entry
      </button>

      <input
        className="search"
        type="search"
        value={query}
        placeholder="Search your journal"
        aria-label="Search your journal"
        enterKeyHint="search"
        onChange={(e) => setQuery(e.target.value)}
      />

      {shown.length === 0 && <p className="no-results">No entries match “{query.trim()}”.</p>}

      {groups.map((g) => (
        <section key={g.key} className="log-day" aria-label={g.label}>
          <h3 className="log-day-title">{g.label}</h3>
          <ul className="log-list">
            {g.walks.map((item) => (
              <li key={item.id}>
                {item.kind === 'entry' ? (
                  <button
                    className="log-entry journal-item"
                    data-testid="journal-item"
                    onClick={() => openEditor(draftFromEntry(item.entry))}
                  >
                    <div className="log-entry-top">
                      <span className="log-time">{formatTimeOfDay(item.time)}</span>
                      <span className="journal-title">{item.entry.title}</span>
                      {item.entry.mood && (
                        <span className="journal-mood" title={moodInfo(item.entry.mood).label}
                          aria-label={`Mood: ${moodInfo(item.entry.mood).label}`}>
                          {moodInfo(item.entry.mood).emoji}
                        </span>
                      )}
                    </div>
                    {item.entry.body && <p className="log-note">{item.entry.body}</p>}
                  </button>
                ) : (
                  <button
                    className="log-entry journal-item journal-walk"
                    data-testid="journal-item"
                    onClick={() => onOpenWalk(item.walk.id)}
                  >
                    <div className="log-entry-top">
                      <span className="log-time">{formatTimeOfDay(item.time)}</span>
                      <span className="log-minutes"><span className="tag tag-walk">🚶 Walk note</span></span>
                      <ResultPill result={item.walk.result} />
                    </div>
                    <p className="log-note">{item.walk.note}</p>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="journal-footnote">Walk notes come from your Log. Tap one to edit it there.</p>
    </div>
  )
}

export default JournalTab
