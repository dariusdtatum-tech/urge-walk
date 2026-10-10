import { useState } from 'react'
import { todayISO } from '../lib/cleanTime.js'
import { makePrimary } from '../lib/homeStats.js'
import { backfillTracker, loadMilestones, removeTracker } from '../lib/milestones.js'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import HabitSheet from './HabitSheet.jsx'
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

  const sheets = (
    <>
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
          onClose={back}
        />
      )}
    </>
  )
  return { habits, recoveredInitially: initial.recovered, notice, setNotice, sheet, setSheet, sheets }
}
