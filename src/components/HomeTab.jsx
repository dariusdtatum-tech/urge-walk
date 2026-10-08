import { useState } from 'react'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import { useToday } from '../lib/useToday.js'
import HabitCard from './HabitCard.jsx'
import HabitSheet from './HabitSheet.jsx'

// Home tab: the clean-time tracker.
function HomeTab() {
  const today = useToday()
  // Load saved habits once, when the tab first appears.
  const [initial] = useState(() => loadHabits())
  const [habits, setHabits] = useState(initial.habits)
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some saved data was damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )
  // null = closed, { mode: 'add' } or { mode: 'edit', habit }
  const [sheet, setSheet] = useState(null)

  function update(next) {
    setHabits(next)
    if (!saveHabits(next)) setNotice('Couldn’t save on this phone. Is private browsing on?')
  }

  function handleSave(values) {
    if (sheet.mode === 'add') {
      update([...habits, { id: makeId(), ...values }])
    } else {
      update(habits.map((h) => (h.id === sheet.habit.id ? { ...h, ...values } : h)))
    }
    setSheet(null)
  }

  function handleDelete() {
    update(habits.filter((h) => h.id !== sheet.habit.id))
    setSheet(null)
  }

  return (
    <div className="home">
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      {habits.length === 0 ? (
        <section className="empty">
          <div className="empty-icon" aria-hidden="true">🌅</div>
          <h2>Every day counts</h2>
          <p>Add the date you started, and Urge Walk will count your clean days. It stays on this phone only.</p>
          <button className="btn btn-primary btn-big" onClick={() => setSheet({ mode: 'add' })}>
            Add your sober date
          </button>
        </section>
      ) : (
        <>
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} today={today} onEdit={() => setSheet({ mode: 'edit', habit: h })} />
          ))}
          <button className="btn btn-secondary btn-big" onClick={() => setSheet({ mode: 'add' })}>
            + Add another
          </button>
        </>
      )}

      {sheet && (
        <HabitSheet
          key={sheet.mode === 'edit' ? sheet.habit.id : 'new'}
          habit={sheet.mode === 'edit' ? sheet.habit : null}
          today={today}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  )
}

export default HomeTab
