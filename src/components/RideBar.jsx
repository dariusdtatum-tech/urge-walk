import { WaveIcon } from './Icons.jsx'

// Home's Ride it out bar, for everyone: the one big, obvious action when an urge hits.
// While a walk is live it becomes "Back to your walk".
function RideBar({ live, onRide, onResume }) {
  return (
    <button type="button" className="ride-bar" data-testid="ride-bar" onClick={live ? onResume : onRide}>
      <span className="ride-bar-ic" aria-hidden="true"><WaveIcon size={26} /></span>
      <span className="ride-bar-text">
        <span className="ride-bar-title">{live ? 'Back to your walk' : 'Ride it out'}</span>
        <span className="ride-bar-sub">{live ? 'Your walk is still going' : 'Walk, breathe, or just log it'}</span>
      </span>
      <span className="ride-bar-go" aria-hidden="true">›</span>
    </button>
  )
}

export default RideBar
