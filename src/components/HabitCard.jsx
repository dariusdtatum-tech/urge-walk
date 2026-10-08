import { breakdown, daysBetween, formatBreakdown, formatDate } from '../lib/cleanTime.js'

// One habit: big day count, friendly breakdown, and the start date.
function HabitCard({ habit, today, onEdit }) {
  const days = daysBetween(habit.startDate, today)
  const isFuture = days < 0 // e.g. the phone's clock was changed

  return (
    <article className="habit-card">
      <div className="habit-top">
        <h2 className="habit-name">{habit.name}</h2>
        <button className="icon-btn" onClick={onEdit} aria-label={`Edit ${habit.name}`}>
          Edit
        </button>
      </div>

      <div className="habit-days">
        <span className="habit-number" data-testid="days">{isFuture ? 0 : days.toLocaleString()}</span>
        <span className="habit-unit">{days === 1 ? 'day' : 'days'} clean</span>
      </div>

      <p className="habit-breakdown">
        {isFuture ? 'Starts soon' : formatBreakdown(breakdown(habit.startDate, today))}
      </p>
      <p className="habit-since">Since {formatDate(habit.startDate)}</p>
    </article>
  )
}

export default HabitCard
