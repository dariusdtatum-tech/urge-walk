import { RANGES, RANGE_IDS, bucketCounts, rangeBuckets, rangeStats, threeDayAverage } from '../lib/homeStats.js'
import { FlameIcon } from './Icons.jsx'
import WeekChart from './WeekChart.jsx'

// "Your walks": Week / Month / All time switches only what's inside this card.
// The Streak chip is the clean-day streak and never changes with the range.
function WalksCard({ walks, range, onRange, streak, now, since }) {
  const stats = rangeStats(walks, range, now)
  const buckets = rangeBuckets(range, now, since)
  const counts = bucketCounts(walks, buckets)
  const values = range === 'month' ? threeDayAverage(counts) : counts
  // The chart counts every urge ridden out; say so once breathing or logged urges are in the mix.
  const mixed = walks.some((w) => w.kind && w.kind !== 'walk')
  const caption = mixed ? RANGES[range].captionAll : RANGES[range].caption

  return (
    <section className="walks-card" aria-labelledby="walks-title">
      <div className="walks-head">
        <h2 id="walks-title">Your walks</h2>
        <div className="seg" role="group" aria-label="Walks range">
          {RANGE_IDS.map((id) => (
            <button key={id} className={id === range ? 'seg-btn active' : 'seg-btn'} aria-pressed={id === range}
              onClick={() => onRange(id)}>
              {RANGES[id].name}
            </button>
          ))}
        </div>
      </div>

      <div className="chips" data-testid="chips">
        <div className="chip-stat" data-testid="chip-walked">
          <span className="stat-num">{stats.walked}</span>
          <span className="stat-label">Walked</span>
          {stats.riddenOut > stats.walked && <span className="stat-sub" data-testid="chip-ridden">{stats.riddenOut} ridden out</span>}
        </div>
        <div className="chip-stat" data-testid="chip-passed">
          <span className="stat-num">{stats.passed}</span>
          <span className="stat-label">Passed</span>
        </div>
        {streak != null && (
          <div className="chip-stat" data-testid="chip-streak">
            <span className="stat-num"><FlameIcon />{streak.toLocaleString()}</span>
            <span className="stat-label">Streak</span>
          </div>
        )}
      </div>

      <WeekChart buckets={buckets} counts={values} caption={caption} dots={range === 'week'} />
    </section>
  )
}

export default WalksCard
