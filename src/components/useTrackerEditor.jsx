import { useEffect, useState } from 'react'
import { resetTracker, undoReset } from '../lib/homeIdeas.js'
import { loadWalks } from '../lib/walkStorage.js'
import { todayISO } from '../lib/cleanTime.js'
import { makePrimary } from '../lib/homeStats.js'
import { backfillTracker, loadMilestones, removeTracker } from '../lib/milestones.js'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import HabitSheet from './HabitSheet.jsx'
import ResetSheet from './ResetSheet.jsx'
import TrackerSheet from './TrackerSheet.jsx'

// Editing trackers, shared by Home ("Edit") and the You tab, so both behave the same:
// list -> add / edit / delete, earned milestones kept on a reset, deleted trackers' milestones removed.
export function useTrackerEditor({ today, onOpenBackup, onMilestones }) {
  const [initial] = useState(() => loadHabits())
  const [habits, setHabits] = useState(initial.habits)
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some saved data was damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )
  // null, { mode: 'manage' }, { mode: 'add', from }, or { mode: 'edit', habit, from }
  const [sheet, setSheet] = useState(null)
  // After a reset: { habitId, name } for the 8-second "History kept." toast with Undo.
  const [undo, setUndo] = useState(null)
  useEffect(() => {
    if (!undo) return undefined
    const t = setTimeout(() => setUndo(null), 8000)
    return () => clearTimeout(t)
  }, [undo])

  function update(next) {
    setHabits(next)
    if (!saveHabits(next)) setNotice('Couldn’t save on this phone. Is private browsing on?')
  }
  const back = () => setSheet(sheet?.from === 'manage' ? { mode: 'manage' } : null)

  function handleSave(values) {
    if (sheet.mode === 'add') {
      update([...habits, { id: makeId(), ...values }])
    } else {
      const habit = { ...sheet.habit, ...values }
      // A hand-edited start date has no known start time.
      if (values.startDate !== sheet.habit.startDate) delete habit.startedAt
      // A new start date: milestones it has already passed are earned quietly (no sheets).
      if (values.startDate !== sheet.habit.startDate) onMilestones(backfillTracker(loadMilestones(), habit, todayISO()))
      update(habits.map((h) => (h.id === sheet.habit.id ? habit : h)))
    }
    back()
  }

  function handleDelete() {
    onMilestones(removeTracker(loadMilestones(), sheet.habit.id))
    update(habits.filter((h) => h.id !== sheet.habit.id))
    back()
  }

  // Start a new count: history, milestones and the lifetime count are untouched.
  function handleReset(startDate) {
    const habit = habits.find((h) => h.id === sheet.habit.id)
    const next = resetTracker(habit, startDate)
    update(habits.map((h) => (h.id === habit.id ? next : h)))
    setSheet(null)
    setUndo({ habitId: habit.id })
  }
  // Undo puts the previous start date (and time) back exactly.
  function handleUndo() {
    update(habits.map((h) => (h.id === undo.habitId ? undoReset(h) : h)))
    setUndo(null)
  }

  const sheets = (
    <>
      {sheet?.mode === 'reset' && (
        <ResetSheet
          habit={sheet.habit}
          milestones={loadMilestones()}
          lifetime={loadWalks().walks.length}
          today={today}
          onConfirm={handleReset}
          onClose={() => setSheet({ mode: 'edit', habit: sheet.habit, from: sheet.from })}
        />
      )}
      {undo && (
        <div className="toast toast-undo" role="status" data-testid="reset-toast">
          <span>New count started. History kept.</span>
          <button type="button" className="toast-action" onClick={handleUndo}>Undo</button>
        </div>
      )}
      {sheet?.mode === 'manage' && (
        <TrackerSheet
          habits={habits}
          today={today}
          onEdit={(habit) => setSheet({ mode: 'edit', habit, from: 'manage' })}
          onAdd={() => setSheet({ mode: 'add', from: 'manage' })}
          onMakePrimary={(id) => update(makePrimary(habits, id))}
          onOpenBackup={() => { setSheet(null); onOpenBackup() }}
          onClose={() => setSheet(null)}
        />
      )}
      {(sheet?.mode === 'add' || sheet?.mode === 'edit') && (
        <HabitSheet
          key={sheet.mode === 'edit' ? sheet.habit.id : 'new'}
          habit={sheet.mode === 'edit' ? sheet.habit : null}
          today={today}
          onSave={handleSave}
          onDelete={handleDelete}
          onReset={() => setSheet({ mode: 'reset', habit: sheet.habit, from: sheet.from })}
          onClose={back}
        />
      )}
    </>
  )
  return { habits, recoveredInitially: initial.recovered, notice, setNotice, sheet, setSheet, sheets }
}
